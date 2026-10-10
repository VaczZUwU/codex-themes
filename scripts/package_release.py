"""Build a source-only release from an explicit allowlist."""
from pathlib import Path
import hashlib
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ['VERSION', 'LICENSE', 'README.md', 'README.ru.md', 'CHANGELOG.md',
         'THIRD_PARTY_NOTICES.md', 'Install.cmd', 'Uninstall.cmd', 'install.py',
         '.gitignore', '.gitattributes', 'src/doki.js', 'tests/test_installer.py',
         'scripts/package_release.py', 'docs/COMPATIBILITY.md', 'docs/RELEASING.md', 'docs/VALIDATION.md',
         'src/themes.json', 'src/update-check.cjs', 'tests/test_update_checker.cjs', 'tests/test_custom_themes.py', 'tests/animated_wallpapers.json', 'tests/accent_wallpapers.json', 'licenses/Doki-Theme-MIT.txt',
         '.github/workflows/ci.yml', '.github/workflows/release.yml']


def package():
    version = (ROOT/'VERSION').read_text().strip()
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Invalid release version')
    installer_version = re.search(r"^VERSION = '([^']+)'", (ROOT/'install.py').read_text(encoding='utf8'), re.M)[1]
    if version != installer_version:
        raise ValueError('Installer version does not match VERSION')
    dist = ROOT/'dist'
    dist.mkdir(exist_ok=True)
    archive = dist/f'codex-doki-{version}-source.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as out:
        for name in FILES:
            data = (ROOT/name).read_bytes()
            # Git checkouts can use different line endings on Windows/Linux.
            data = data.replace(b'\r\n', b'\n')
            if name.endswith('.cmd'):
                data = data.replace(b'\n', b'\r\n')
            if re.search(rb'C:[/\\]Users[/\\]|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}', data, re.I):
                raise ValueError(f'Personal path or potential secret in {name}')
            info = zipfile.ZipInfo(f'codex-doki-{version}/{name}', date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            out.writestr(info, data)
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    (dist/'SHA256SUMS.txt').write_text(f'{checksum}  {archive.name}\n', encoding='ascii')
    print(f'{archive.name}: {len(FILES)} source files, {archive.stat().st_size} bytes')
    print(f'SHA256: {checksum}')
    return archive


if __name__ == '__main__':
    package()
