from pathlib import Path
import configparser
import hashlib
import importlib.util
import json
import struct
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('installer', ROOT/'install.py')
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


def make_archive(path, entries):
    tree = {'files': {}}
    offset = 0
    for name, data in entries.items():
        branch = tree
        parts = name.split('/')
        for part in parts[:-1]:
            branch = branch['files'].setdefault(part, {'files': {}})
        branch['files'][parts[-1]] = {'offset': str(offset), 'size': len(data)}
        offset += len(data)
    header = json.dumps(tree, separators=(',', ':')).encode()
    padding = (-len(header)) % 4
    path.write_bytes(struct.pack('<4I', 4, len(header)+padding+8,
                                len(header)+padding+4, len(header))+header+b'\0'*padding+b''.join(entries.values()))
    return header


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_archive_replacement_preserves_other_entries_and_integrity(self):
        source, destination = self.root/'source.asar', self.root/'patched.asar'
        original = make_archive(source, {'webview/index.html': b'<body></body>', 'keep.txt': b'keep me'})
        source_hash = installer.file_hash(source)
        additions = {'webview/index.html': b'<body>new</body>', 'webview/doki/test.js': b'new script'}
        old, new = installer.patch_archive(source, destination, additions)
        tree, header, base = installer.read_header(destination)
        self.assertEqual(old, hashlib.sha256(original).hexdigest().encode())
        self.assertEqual(new, hashlib.sha256(header).hexdigest().encode())
        self.assertEqual(installer.read_entry(destination, tree, base, 'keep.txt'), b'keep me')
        for path, data in additions.items():
            self.assertEqual(installer.read_entry(destination, tree, base, path), data)
            entry = installer.node_at(tree, path)
            self.assertEqual(entry['integrity']['hash'], hashlib.sha256(data).hexdigest())
            self.assertEqual(entry['integrity']['blocks'], [hashlib.sha256(data).hexdigest()])
        self.assertEqual(installer.file_hash(source), source_hash)

    def test_invalid_archive_rejected(self):
        source = self.root/'invalid.asar'
        source.write_bytes(b'not an archive')
        with self.assertRaises(ValueError):
            installer.read_header(source)

    def test_traversal_and_unsafe_asset_rejected(self):
        source = self.root/'source.asar'
        make_archive(source, {'original': b'x'})
        with self.assertRaises(ValueError):
            installer.patch_archive(source, self.root/'target', {'../outside': b'bad'})
        for name in ('../image.png', 'image;cmd.png', '/image.png', 'image.jpg'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                installer.safe_asset(name)

    def test_offline_never_downloads(self):
        with patch.object(installer.urllib.request, 'urlopen') as network:
            with self.assertRaises(ValueError):
                installer.obtain_asset('missing.png', self.root, True)
            network.assert_not_called()

    def test_bundled_catalog_needs_no_vscode_extension(self):
        with patch.object(installer, 'load_themes', side_effect=AssertionError('VS Code must not be required')):
            themes, version = installer.load_bundled_themes()
        self.assertEqual(version, '88.1.18')
        self.assertEqual(len(themes), 88)
        self.assertEqual(len({image['file'] for theme in themes for image in theme['images']}), 103)

    def test_download_cached_for_future_offline_install(self):
        data = installer.PNG+b'fixture'
        from io import BytesIO
        response = BytesIO(data)
        response.url = 'https://doki.assets.unthrottled.io/backgrounds/wallpapers/test.png'
        with patch.object(installer.urllib.request, 'urlopen', return_value=response):
            self.assertEqual(installer.obtain_asset('test.png', self.root, False), ('test.png', data))
        with patch.object(installer.urllib.request, 'urlopen') as network:
            self.assertEqual(installer.obtain_asset('test.png', self.root, True), ('test.png', data))
            network.assert_not_called()

    def test_cached_image_used_offline(self):
        (self.root/'backgrounds').mkdir()
        data = installer.PNG+b'fixture'
        (self.root/'backgrounds/valid.png').write_bytes(data)
        self.assertEqual(installer.obtain_asset('valid.png', self.root, True), ('valid.png', data))

    def test_uninstall_refuses_unmarked_directory(self):
        protected = self.root/'unrelated'
        protected.mkdir()
        (protected/'keep').write_text('keep')
        with self.assertRaises(ValueError):
            installer.uninstall(protected)
        self.assertTrue((protected/'keep').exists())

    def test_uninstall_refuses_marker_path_mismatch(self):
        protected = self.root/'mismatch'
        protected.mkdir()
        (protected/installer.MARKER).write_text(json.dumps({'product': 'codex-doki', 'installRoot': str(self.root)}))
        with self.assertRaises(ValueError):
            installer.uninstall(protected)
        self.assertTrue(protected.exists())

    def test_fresh_install_and_uninstall_leave_source_and_profile(self):
        source = self.root/'app'
        (source/'resources').mkdir(parents=True)
        header = make_archive(source/'resources/app.asar', {'webview/index.html': b'<body></body>', 'keep': b'original', '.vite/build/early-bootstrap.js': b'// main'})
        original_exe = b'executable'+hashlib.sha256(header).hexdigest().encode()
        (source/'ChatGPT.exe').write_bytes(original_exe)
        config = configparser.ConfigParser()
        config.optionxform = str
        config.read_string('[Owl]\nUserDataDirectoryName=Codex\nAppVersion=test\n')
        prepared = {'source': source, 'archive': source/'resources/app.asar', 'exe': original_exe,
                    'html': '<body></body>', 'themes': [], 'locales': {}, 'config': config,
                    'codexVersion': 'test', 'dokiVersion': 'test', 'mainEntry': '.vite/build/early-bootstrap.js', 'mainSource': b'// main'}
        profile = self.root/'profile'
        profile.mkdir()
        (profile/'preferences').write_text('retained')
        target = self.root/'installed'
        launcher = installer.install(prepared, target, self.root, True)
        self.assertTrue(launcher.is_file())
        self.assertEqual((source/'ChatGPT.exe').read_bytes(), original_exe)
        self.assertNotEqual((target/'runtime/ChatGPT.exe').read_bytes(), original_exe)
        self.assertIn('UserDataDirectoryName=Codex-Doki', (target/'runtime/resources/owl-app.ini').read_text())
        with self.assertRaises(ValueError):
            installer.install(prepared, target, self.root, True)
        installer.uninstall(target)
        self.assertFalse(target.exists())
        self.assertTrue(source.exists())
        self.assertEqual((profile/'preferences').read_text(), 'retained')


if __name__ == '__main__':
    unittest.main()
