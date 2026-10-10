# Compatibility and troubleshooting

| Component | Tested |
| --- | --- |
| Platform | Windows x64 |
| Codex Store package | 26.1002.7124.0 |
| Codex internal AppVersion | 26.1002.52244 |
| Doki Theme extension | 88.1.18 |
| Theme catalog | 88 themes / 103 artwork files |
| UI locale catalog | 64 native translations + English |
| Installer | Python 3.10+ standard library |

The Store package version and internal AppVersion differ. The installer compares the internal
version from `resources/owl-app.ini` and checks the archive/executable layout before writing anything.
Use `check` to inspect your installation. Untested builds require `--allow-unsupported`; this flag
does not bypass structural or archive integrity validation.

## Known limitations

- This is a runtime copy modification, not an official plugin API. Native selectors can change with updates.
- The modified executable is no longer covered by the original digital signature. The original Store app
  keeps its signature. CSP is preserved; the copied executable's ASAR hash is updated to match the new archive.
- Windows protections or application policy may prevent the modified copy from running.
- The copy uses a separate UI profile but may share `.codex` projects/history. Uninstall retains both.
- Updates require rebuilding the copy; this project does not patch the installed Store app.
- Other operating systems, Codex builds and Doki catalog formats have not been verified.
- Code block backgrounds prioritize readable native syntax colors over artwork transparency.
- Some localized Doki labels reuse native settings terminology; dedicated theme names remain untranslated.

## Errors

**Codex not found:** install the Windows app, or pass `--codex-path` to the `app` directory containing
`ChatGPT.exe` and `resources/app.asar`.

**Doki not found:** install Doki Theme in VS Code/VS Code Insiders, or provide `--extension-path`.

**Unsupported layout or locale:** use an original installation matching the compatibility table.
Do not disable integrity/CSP checks to work around this error.

**Download error:** retry with internet access to Doki's asset server. `--offline` requires all original
wallpaper PNGs in the existing Doki cache. Use `--cache-path` if it is stored elsewhere.

**Existing destination:** the installer refuses to overwrite it. Close the Doki copy and uninstall it,
or choose a different `--install-dir`.

**Cannot uninstall:** close that exact Doki runtime. The uninstaller will not kill Codex processes.
It refuses to remove directories without a matching installation marker.
