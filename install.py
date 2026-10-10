"""Local Windows installer. Uses only the Python standard library."""
from pathlib import Path, PurePosixPath
import argparse
import concurrent.futures
import configparser
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import time
import urllib.parse
import urllib.request

VERSION = '0.1.0'
TESTED_CODEX = '26.1002.52244'
TESTED_DOKI = '88.1.18'
BASE = Path(__file__).resolve().parent
MARKER = 'codex-doki-install.json'
PNG = b'\x89PNG\r\n\x1a\n'


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_header(archive):
    with Path(archive).open('rb') as f:
        raw = f.read(16)
        if len(raw) != 16:
            raise ValueError('Invalid ASAR header')
        sizes = struct.unpack('<4I', raw)
        if sizes[0] != 4 or not 0 < sizes[3] <= 64 * 1024 * 1024:
            raise ValueError('Unsupported ASAR header')
        header = f.read(sizes[3])
        if len(header) != sizes[3]:
            raise ValueError('Truncated ASAR header')
        return json.loads(header), header, 8 + sizes[1]


def node_at(tree, path):
    node = tree
    for part in PurePosixPath(path).parts:
        node = node['files'][part]
    return node


def read_entry(archive, tree, base, path):
    entry = node_at(tree, path)
    if 'offset' not in entry or 'size' not in entry:
        raise ValueError(f'Expected packed file: {path}')
    with Path(archive).open('rb') as f:
        f.seek(base + int(entry['offset']))
        data = f.read(entry['size'])
    if len(data) != entry['size']:
        raise ValueError(f'Truncated file: {path}')
    return data


def patch_archive(source, destination, additions):
    tree, original_header, base = read_header(source)
    offset = Path(source).stat().st_size - base
    for path, data in additions.items():
        parts = PurePosixPath(path).parts
        if not parts or path.startswith('/') or '..' in parts or '\\' in path:
            raise ValueError(f'Invalid archive path: {path}')
        branch = tree
        for part in parts[:-1]:
            branch = branch.setdefault('files', {}).setdefault(part, {'files': {}})
        block = 4 * 1024 * 1024
        branch.setdefault('files', {})[parts[-1]] = {
            'size': len(data), 'offset': str(offset), 'integrity': {
                'algorithm': 'SHA256', 'hash': hashlib.sha256(data).hexdigest(),
                'blockSize': block, 'blocks': [hashlib.sha256(data[i:i+block]).hexdigest()
                                             for i in range(0, len(data), block)]}}
        offset += len(data)
    header = json.dumps(tree, separators=(',', ':'), ensure_ascii=False).encode()
    padding = (-len(header)) % 4
    with Path(destination).open('wb') as out, Path(source).open('rb') as inp:
        out.write(struct.pack('<4I', 4, len(header)+padding+8,
                              len(header)+padding+4, len(header)))
        out.write(header)
        out.write(b'\0' * padding)
        inp.seek(base)
        shutil.copyfileobj(inp, out, 4 * 1024 * 1024)
        for data in additions.values():
            out.write(data)
    return hashlib.sha256(original_header).hexdigest().encode(), hashlib.sha256(header).hexdigest().encode()


def powershell(script):
    return subprocess.check_output(['powershell.exe', '-NoProfile', '-NonInteractive',
                                    '-Command', script], text=True, encoding='utf-8').strip()


def detect_codex():
    data = powershell("[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; "
                      "Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | "
                      "Select-Object -First 1 -ExpandProperty InstallLocation")
    if not data:
        raise ValueError('Codex was not found. Install it, or pass --codex-path PATH to its app directory.')
    return Path(data) / 'app'


def detect_extension():
    candidates = []
    for root in (Path.home()/'.vscode/extensions', Path.home()/'.vscode-insiders/extensions'):
        for folder in root.glob('unthrottled.doki-theme-*'):
            try:
                package = json.loads((folder/'package.json').read_text(encoding='utf8'))
                version = tuple(int(x) for x in package['version'].split('.'))
                candidates.append((version, folder))
            except (OSError, ValueError, KeyError):
                continue
    if not candidates:
        raise ValueError('Install unthrottled.doki-theme in VS Code, or pass --extension-path PATH.')
    return max(candidates)[1]


def safe_asset(name):
    if not re.fullmatch(r'[A-Za-z0-9_.-]+\.png', name) or '..' in name:
        raise ValueError(f'Unsupported image filename: {name}')
    return name


def load_themes(extension):
    source = (extension/'out/DokiThemeDefinitions.js').read_text(encoding='utf8')
    definitions = json.loads(source[source.index('[{'):source.rindex('];') + 1])
    package = json.loads((extension/'package.json').read_text(encoding='utf8'))
    normalize = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
    paths = {normalize(Path(t['path']).name.removesuffix('.theme.json')): t['path']
             for t in package['contributes']['themes']}
    themes = []
    for item in definitions:
        d = item['themeDefinition']
        info = d['information']
        path = (extension/paths[normalize(info['name'])]).resolve()
        if not path.is_relative_to(extension.resolve()):
            raise ValueError('Theme definition points outside the extension')
        colors = json.loads(path.read_text(encoding='utf8'))['colors']
        images = []
        for variant, image in d['stickers'].items():
            opacity = info['stickers'].get(variant, info['stickers']['default']).get('opacity', 10)/100
            images.append({'variant': variant, 'file': safe_asset(image['name']),
                           'anchor': image.get('anchoring', 'right'), 'readingOpacity': opacity})
        palette = {'background': colors.get('editor.background', '#111214')[:7],
                   'foreground': colors.get('editor.foreground', '#eeeeee')[:7],
                   'accent': colors.get('button.background', colors.get('focusBorder', '#EFB744'))[:7]}
        if not all(re.fullmatch(r'#[0-9a-fA-F]{6}', value) for value in palette.values()):
            raise ValueError('Unsupported theme palette')
        themes.append({'name': info['name'], 'group': info['group'], 'dark': info['dark'],
                       'colors': palette, 'images': images})
    return sorted(themes, key=lambda t: (t['group'], t['name'])), package['version']


def extract_locales(archive):
    keys = {
        'notSelected': 'chatgpt.imagegenInput.noSelection',
        'theme': 'settings.general.appearance.theme', 'visualStyle': 'settings.appearance.visualStyle',
        'wallpaper': 'settings.general.appearance.chromeTheme.surface.short',
        'reset': 'browserSidebar.zoomBanner.reset', 'close': 'common.close',
        'search': 'codex.commandMenu.searchThemesPlaceholder', 'empty': 'codex.commandMenu.noResults',
        'primary': 'settings.appearance.chatGptAccent.default', 'variant': 'presentationEditor.fillImageLabel',
        'dark': 'settings.general.appearance.darkChromeTheme', 'homeStatus': 'sidebarElectron.homeNavigation',
        'readingStatus': 'codex.pages.chatPreview.title', 'failed': 'presentationEditor.imagePreviewFailed'}
    tree, _, base = read_header(archive)
    catalog = {}
    for name, entry in node_at(tree, 'webview/assets')['files'].items():
        match = re.fullmatch(r'([a-z]{2}(?:-[A-Z]{2}|-419)?)-[0-9a-f]+\.js', name)
        if not match or entry.get('size', 0) < 1000000:
            continue
        source = read_entry(archive, tree, base, 'webview/assets/'+name).decode('utf8')
        strings = dict(re.findall(r'"([^"\n]+)":`([^`]+)`', source))
        labels = {label: strings[key] for label, key in keys.items()}
        opacity = strings['presentationEditor.opacity']
        labels.update(brightness=f"{labels['homeStatus']} · {opacity}",
                      reading=f"{labels['readingStatus']} · {opacity}", themeReading=f'Doki · {opacity}',
                      enabled=f"{labels['wallpaper']} · {labels['variant']}", chooseTheme=labels['theme'],
                      alternate='2', settings='Doki Theme', themes='')
        if any('${' in value or '{' in value for value in labels.values()):
            raise ValueError('Unsupported locale format')
        catalog[match[1]] = labels
    if 'ru-RU' not in catalog:
        raise ValueError('Native locale catalog is incompatible')
    return catalog


def prepare(source, extension, allow_unsupported=False):
    source, extension = source.resolve(), extension.resolve()
    archive = source/'resources/app.asar'
    tree, header, base = read_header(archive)
    html = read_entry(archive, tree, base, 'webview/index.html').decode('utf8')
    if html.count('</body>') != 1 or './doki/doki.js' in html:
        raise ValueError('Expected an original, unmodified Codex installation')
    exe = (source/'ChatGPT.exe').read_bytes()
    if exe.count(hashlib.sha256(header).hexdigest().encode()) != 1:
        raise ValueError('Unsupported executable archive integrity resource')
    config = configparser.ConfigParser()
    config.optionxform = str
    config.read(source/'resources/owl-app.ini', encoding='utf8')
    version = config['Owl']['AppVersion']
    themes, doki_version = load_themes(extension)
    if not allow_unsupported and (version != TESTED_CODEX or doki_version != TESTED_DOKI):
        raise ValueError(f'Untested versions: Codex {version}, Doki {doki_version}. '
                         'See docs/COMPATIBILITY.md. --allow-unsupported opts into testing this combination.')
    locales = extract_locales(archive)
    return {'source': source, 'archive': archive, 'themes': themes, 'locales': locales,
            'html': html, 'exe': exe, 'config': config, 'codexVersion': version, 'dokiVersion': doki_version}


def obtain_asset(name, cache, offline):
    cached = cache/'backgrounds'/name
    if cached.is_file():
        data = cached.read_bytes()
        if data.startswith(PNG):
            return name, data
    if offline:
        raise ValueError(f'Image missing from Doki cache: {name}')
    url = 'https://doki.assets.unthrottled.io/backgrounds/wallpapers/'+urllib.parse.quote(name)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                if not response.url.startswith('https://doki.assets.unthrottled.io/'):
                    raise ValueError('Unexpected asset redirect')
                data = response.read(32 * 1024 * 1024 + 1)
            if not data.startswith(PNG) or len(data) > 32 * 1024 * 1024:
                raise ValueError(f'Invalid artwork: {name}')
            return name, data
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1)


def install(prepared, destination, cache, offline=False):
    destination = destination.resolve()
    source = prepared['source']
    if destination.exists():
        raise ValueError('Destination already exists. Uninstall the previous copy or choose a new --install-dir.')
    if destination == source or destination.is_relative_to(source) or source.is_relative_to(destination):
        raise ValueError('Install directory must be separate from the original Codex')
    names = sorted({i['file'] for t in prepared['themes'] for i in t['images']})
    print(f'Loading {len(names)} original images from Doki cache/CDN...', flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        assets = dict(pool.map(lambda name: obtain_asset(name, cache, offline), names))
    js = ('const DOKI_THEMES = '+json.dumps(prepared['themes'], ensure_ascii=False)+';\n'
          'const DOKI_LOCALES = '+json.dumps(prepared['locales'], ensure_ascii=False)+';\n'
          +(BASE/'src/doki.js').read_text(encoding='utf8')).encode()
    html = prepared['html'].replace('</body>', '<script src="./doki/doki.js"></script>\n</body>')
    additions = {'webview/index.html': html.encode(), 'webview/doki/doki.js': js}
    additions.update({'webview/doki/'+name: data for name, data in assets.items()})
    size = sum(p.stat().st_size for p in source.rglob('*') if p.is_file()) + sum(map(len, additions.values()))
    destination.parent.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage(destination.parent).free < size + 256 * 1024 * 1024:
        raise ValueError('Insufficient space for the runtime copy; allow at least 3 GB.')
    # Staging is generated under the destination parent and only this owned staging is cleaned on failure.
    staging = Path(tempfile.mkdtemp(prefix='.codex-doki-build-', dir=destination.parent))
    try:
        print('Copying Codex. This can take several minutes...', flush=True)
        runtime = staging/'runtime'
        shutil.copytree(source, runtime)
        old_hash, new_hash = patch_archive(prepared['archive'], runtime/'resources/app.asar', additions)
        (runtime/'ChatGPT.exe').write_bytes(prepared['exe'].replace(old_hash, new_hash))
        prepared['config']['Owl']['UserDataDirectoryName'] = 'Codex-Doki'
        with (runtime/'resources/owl-app.ini').open('w', encoding='utf8') as f:
            prepared['config'].write(f, space_around_delimiters=False)
        (staging/'Start-Doki.cmd').write_text('@echo off\r\nstart "Codex Doki" "%~dp0runtime\\ChatGPT.exe"\r\n', encoding='ascii')
        manifest = {'product': 'codex-doki', 'version': VERSION, 'installRoot': str(destination),
                    'codexVersion': prepared['codexVersion'], 'dokiVersion': prepared['dokiVersion'],
                    'themes': len(prepared['themes']), 'images': len(assets),
                    'sourceAsarSha256': file_hash(prepared['archive']),
                    'patchedHeaderSha256': new_hash.decode()}
        (staging/MARKER).write_text(json.dumps(manifest, indent=2), encoding='utf8')
        staging.rename(destination)
    except BaseException:
        shutil.rmtree(staging)
        raise
    return destination/'Start-Doki.cmd'


def uninstall(destination):
    destination = destination.resolve()
    marker = destination/MARKER
    if not marker.is_file():
        raise ValueError('Refusing to remove a directory without a Codex Doki install marker')
    manifest = json.loads(marker.read_text(encoding='utf8'))
    if manifest.get('product') != 'codex-doki' or Path(manifest.get('installRoot', '')).resolve() != destination:
        raise ValueError('Install marker does not match this directory')
    if destination == BASE or BASE.is_relative_to(destination) or destination == Path(destination.anchor):
        raise ValueError('Refusing to remove the release source or a filesystem root')
    # Detect running clone before deleting; never stop another Codex process.
    executable = str(destination/'runtime/ChatGPT.exe').replace("'", "''")
    if os.name == 'nt' and powershell(f"@(Get-Process -ErrorAction SilentlyContinue | Where-Object {{$_.Path -eq '{executable}'}}).Count") != '0':
        raise ValueError('Close this Codex Doki copy before uninstalling it')
    shutil.rmtree(destination)
    print('Runtime removed. Your Codex-Doki profile and .codex chats/projects were retained.')


def main():
    if sys.version_info < (3, 10):
        raise ValueError('Python 3.10 or newer is required')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['check', 'install', 'uninstall'], nargs='?', default='install')
    parser.add_argument('--codex-path', type=Path, help='Original Codex app directory containing ChatGPT.exe')
    parser.add_argument('--extension-path', type=Path, help='Installed unthrottled.doki-theme extension directory')
    parser.add_argument('--install-dir', type=Path, default=Path(os.environ.get('LOCALAPPDATA', Path.home()))/'CodexDoki')
    parser.add_argument('--cache-path', type=Path, default=Path(os.environ.get('APPDATA', Path.home()))/'Code/User/globalStorage/unthrottled.doki-theme')
    parser.add_argument('--offline', action='store_true', help='Use cached artwork only; never contact CDN')
    parser.add_argument('--allow-unsupported', action='store_true', help='Opt into testing a different application/extension version')
    args = parser.parse_args()
    if os.name != 'nt':
        parser.error('The desktop installer supports Windows only')
    if args.command == 'uninstall':
        uninstall(args.install_dir)
        return
    prepared = prepare(args.codex_path or detect_codex(), args.extension_path or detect_extension(), args.allow_unsupported)
    print(f"Compatible layout: Codex {prepared['codexVersion']}, Doki {prepared['dokiVersion']}; "
          f"{len(prepared['themes'])} themes, {len(prepared['locales'])+1} languages.")
    if args.command == 'check':
        print('Check complete. No installation files changed; no artwork downloaded.')
        return
    launcher = install(prepared, args.install_dir, args.cache_path, args.offline)
    print(f'Installed. Launch using: {launcher}')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, RuntimeError) as error:
        print(f'Error: {error}', file=sys.stderr)
        sys.exit(1)
