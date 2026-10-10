"""Browser regression checks for the custom-theme editor (requires Playwright)."""
import base64
import json
from pathlib import Path
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
try:
    from playwright.sync_api import sync_playwright, expect
except ImportError:
    sync_playwright = None

ROOT = Path(__file__).resolve().parents[1]
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ioAAAAASUVORK5CYII=')

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def do_GET(self):
        if self.path == '/':
            data = b'''<!doctype html><html lang="en"><head><style>body{margin:0;font:13px system-ui;background:#181818;color:#eee}#root{max-width:768px;margin:auto}button{cursor:pointer} [hidden]{display:none!important}</style></head><body><div id="root"><button data-settings-panel-slug="appearance" aria-current="page">Appearance</button><div><div class="group/settings" style="height:80px">Native settings<input name="appearance-theme" type="radio" value="dark"></div></div><div data-app-shell-main-surface></div></div><script src="/payload.js"></script></body></html>'''
            content = 'text/html'
        elif self.path == '/payload.js':
            data = ('const DOKI_THEMES='+ (ROOT/'src/themes.json').read_text(encoding='utf8')+';const DOKI_LOCALES={};\n'+(ROOT/'src/doki.js').read_text(encoding='utf8')).encode()
            content = 'application/javascript'
        else: data, content = PNG, 'image/png'
        self.send_response(200); self.send_header('Content-Type', content+'; charset=utf-8'); self.end_headers(); self.wfile.write(data)

@unittest.skipIf(sync_playwright is None, 'Install playwright and Chromium for browser checks')
class CustomThemes(unittest.TestCase):
    def test_editor_storage_import_export_and_native_reset(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch()
                page = browser.new_page(viewport={'width':1000,'height':1050}, accept_downloads=True)
                errors=[]; page.on('pageerror', lambda e: errors.append(str(e)))
                page.goto(f'http://127.0.0.1:{server.server_port}/')
                page.locator('#doki-settings-tab').click()
                h=page.locator('#doki-controls')
                h.locator('#custom-create').click()
                h.locator('#custom-name').fill('My Aurora')
                h.locator('#custom-background').fill('#fafafa')
                h.locator('#custom-foreground').fill('#eeeeee')
                h.locator('#custom-accent').fill('#7056c5')
                h.locator('#custom-image').set_input_files({'name':'wallpaper.png','mimeType':'image/png','buffer':PNG})
                expect(h.locator('#custom-save')).to_be_enabled()
                h.locator('#custom-save').click()
                expect(h.locator('#theme-name')).to_have_text('My Aurora')
                status=page.evaluate('window.__dokiThemeStatus')
                self.assertEqual(status['palette']['background'], '#fafafa')
                self.assertNotEqual(status['palette']['foreground'], '#eeeeee')
                self.assertTrue(status['image'].startswith('data:image/webp;'))
                self.assertEqual(status['themes'],89)
                page.reload();page.locator('#doki-settings-tab').click()
                expect(h.locator('#theme-name')).to_have_text('My Aurora')
                with page.expect_download() as dl: h.locator('#custom-export').click()
                payload=json.loads(Path(dl.value.path()).read_text())
                self.assertEqual(payload['theme']['name'],'My Aurora')
                self.assertTrue(payload['theme']['wallpaper'].startswith('data:image/'))
                h.locator('#custom-edit').click();h.locator('#custom-name').fill('Edited Aurora');h.locator('#custom-save').click()
                expect(h.locator('#theme-name')).to_have_text('Edited Aurora')
                payload['theme']['name']='Imported Aurora'
                h.locator('#custom-import-file').set_input_files({'name':'theme.json','mimeType':'application/json','buffer':json.dumps(payload).encode()})
                expect(h.locator('#theme-name')).to_have_text('Imported Aurora')
                # Reject remote resources, malformed colors, and duplicate built-in names without mutating the selected theme.
                for change in [{'wallpaper':'https://example.com/x.png'}, {'colors':{'background':'red'}}, {'name':'Senko'}]:
                    bad={**payload,'theme':{**payload['theme'],**change}}
                    h.locator('#custom-import-file').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
                    expect(h.locator('#status')).to_have_text('Could not save or load the theme. Use a unique name, valid colors and an image under 8 MB.')
                    expect(h.locator('#theme-name')).to_have_text('Imported Aurora')
                page.evaluate("document.documentElement.lang='ru-RU'")
                expect(h.locator('#custom-create')).to_have_text('Создать тему')
                h.locator('#custom-edit').click();expect(h.locator('#custom-title')).to_have_text('Изменить тему')
                if directory:=__import__('os').environ.get('DOKI_QA_SCREENSHOTS'):
                    folder=Path(directory);folder.mkdir(parents=True,exist_ok=True)
                    h.locator('#custom-dialog').screenshot(path=str(folder/'custom-editor-ru.png'))
                h.locator('#custom-cancel').click()
                page.locator('#doki-native-tab').click();page.locator('input[name=appearance-theme]').check()
                page.locator('#doki-settings-tab').click();expect(h.locator('#theme-name')).to_have_text('Не выбрана')
                h.locator('#theme-picker').click();h.locator('#search').fill('Imported Aurora');h.locator('#gallery .theme-card').click()
                expect(h.locator('#theme-name')).to_have_text('Imported Aurora')
                page.on('dialog',lambda d:d.accept());h.locator('#custom-delete').click()
                expect(h.locator('#theme-name')).to_have_text('Не выбрана')
                page.reload();page.locator('#doki-settings-tab').click()
                h.locator('#theme-picker').click();h.locator('#search').fill('Aurora')
                self.assertEqual(h.locator('#gallery .theme-card').count(),1)
                h.locator('#gallery .theme-card').click();h.locator('#reset').click()
                h.locator('#theme-picker').click();h.locator('#search').fill('Edited Aurora')
                self.assertEqual(h.locator('#gallery .theme-card').count(),1)
                h.locator('#gallery .theme-card').click()
                page.evaluate("document.documentElement.lang='en'")
                h.locator('#custom-edit').click()
                if directory: h.locator('#custom-dialog').screenshot(path=str(Path(directory)/'custom-editor-en.png'))
                h.locator('#custom-cancel').click();h.locator('#custom-create').click()
                h.locator('#custom-name').fill('No wallpaper');h.locator('#custom-save').click()
                expect(h.locator('#theme-name')).to_have_text('No wallpaper')
                self.assertTrue(page.evaluate('''async()=>{const image=new Image();image.src=window.__dokiThemeStatus.image;await image.decode();const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,1,1).data[3]===0;}'''))
                self.assertEqual(errors,[])
                browser.close()
        finally:
            server.shutdown();server.server_close()

if __name__=='__main__': unittest.main()
