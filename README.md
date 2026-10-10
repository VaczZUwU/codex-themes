# Codex Doki

Original Doki palettes and character artwork in the Codex desktop app for Windows.
Choose a theme from a searchable preview gallery inside **Settings → Appearance → Doki Theme**.

[Русская инструкция](README.ru.md) · [Compatibility](docs/COMPATIBILITY.md) · [Changelog](CHANGELOG.md)

## Preview

The interface follows your Codex language. These screenshots show the **English** interface.
For Russian screenshots, see the [Russian instructions](README.ru.md#скриншоты).

**New chat — Takanashi Rikka**

![Empty new-chat screen in English](https://raw.githubusercontent.com/VaczZUwU/codex-doki/main/docs/screenshots/home-en.png)

**Appearance settings**

![Doki settings in English](https://raw.githubusercontent.com/VaczZUwU/codex-doki/main/docs/screenshots/settings-en.png)

**Theme gallery**

![Theme gallery in English](https://raw.githubusercontent.com/VaczZUwU/codex-doki/main/docs/screenshots/gallery-en.png)

## Features

- 88 themes and 103 original artwork variants with preview cards and variant counts.
- Palettes for chat, sidebar, native settings, menus and controls.
- Bright artwork on the start screen, dimmed behind text; contrast adjustments for readable text.
- Native syntax highlighting retained in code blocks.
- UI language follows Codex automatically: 65 locales in the tested build.
- Select a native Codex theme to turn off Doki. Its selector shows **Not selected** until you pick a Doki theme again.
- Theme, artwork and brightness preferences persist between launches.

## Custom themes (development version)

Open **Settings → Appearance → Doki Theme → Custom themes → Create theme**.
Choose a unique name, background/text/accent colors and an optional local wallpaper, then select **Save and apply**.
Your themes appear alongside Doki presets in the preview gallery. **Edit theme**, **Delete theme** and **Export JSON** operate on the selected custom theme; **Import JSON** loads a previously exported file.

Custom themes are stored locally in the Codex Doki profile, without artificial file-size or theme-count limits. PNG, JPEG and WebP wallpapers retain their original resolution and quality. The accent is chosen automatically from the wallpaper; choosing an accent manually disables automatic selection, and the switch enables it again. JSON includes the embedded image, so sharing the JSON also shares that image. Duplicate theme names are rejected. Resetting appearance preferences keeps saved custom themes. Native theme selection still disables Doki, and automatic contrast correction applies to your colors. The selected theme and its settings are also saved in the persistent theme database and restored after a full application restart.

The custom editor follows Codex's language with English and Russian labels; other languages use English for the new editor controls. This feature is currently in the source/development version; the previously published 0.1.1 ZIP does not include it.

## Install

This is an **experimental, unofficial Windows modification**, not an official Codex extension.
It builds a separate local copy of your installed Codex. It changes that copy's executable and archive,
which invalidates the original executable's signature. The Store installation stays untouched.

Requirements:

1. Windows with Codex already installed. Tested internal app version: **26.1002.52244**
   (Store package **26.1002.7124.0**).
2. **Python 3.10 or newer**, installed from [python.org](https://www.python.org/downloads/windows/).
   Enable the Python launcher or add Python to PATH.
3. At least **3 GB** free space and internet for the first installation.

**VS Code and its Doki extension are not required.** The theme catalog is included;
the installer downloads original artwork automatically and caches it for later installations.

Extract the release ZIP, open **Install.cmd**, and wait for installation to finish. Codex Doki launches automatically.
Start the app with `%LOCALAPPDATA%\CodexDoki\Start-Doki.cmd`.
Open your profile menu → Settings → Appearance → Doki Theme.

No third-party Python packages or administrator access are required for the default destination.
The installer downloads artwork only from Doki's official asset server. Original artwork files and Codex binaries
are not bundled in this release. Some upstream themes include mature artwork.

The UI profile is named `Codex-Doki`; you may need to sign in once. The backend `.codex` directory,
including projects and chat history, can be shared with the original app. This is not a sandbox.

## Command line

```powershell
py -3 install.py check
py -3 install.py install
py -3 install.py install --offline
py -3 install.py install --codex-path "D:\Apps\Codex\app"
py -3 install.py uninstall
```

`check` validates files, archive integrity layout, theme definitions and locale compatibility without
copying Codex or downloading artwork. Use `--install-dir` for a custom destination; pass the same path
to uninstall. An existing destination is never overwritten. Close the Doki copy before uninstalling.
Uninstall retains the UI profile and chats/projects.

The default image cache is `%LOCALAPPDATA%\CodexDokiCache`. `--offline` works after all artwork has been cached.
`--extension-path` is an optional override for users who want to read a different local Doki extension catalog.

## Updating and troubleshooting

The separate copy does not automatically track Store updates. To rebuild, close it, uninstall its runtime,
and install again. Your Doki preferences remain in the retained profile. Other Codex versions are unverified
and require an explicit `--allow-unsupported`; structural checks still run and may reject them.
See [compatibility and troubleshooting](docs/COMPATIBILITY.md).

## Development and releases

```powershell
python -m unittest discover -s tests -v
node --check src/doki.js
python scripts/package_release.py
```

The packaging script builds a source-only ZIP and SHA-256 checksum from an explicit file list.
CI runs tests on Windows and Linux. The tag workflow creates a **draft prerelease** for tags such as `v0.1.0`;
review it before making it public. See [release checklist](docs/RELEASING.md).

## Credits and license

This project's own code is MIT licensed. Codex/OpenAI names and binaries belong to their respective owners.
[Doki Theme](https://github.com/doki-theme/doki-theme-vscode) is created by Unthrottled/Alex Simons.
Its software has an [MIT license](https://github.com/doki-theme/doki-theme-vscode/blob/master/LICENSE);
artwork rights remain with their respective authors. This project's license does not grant rights
to Codex binaries, artwork or native localization files. See [third-party notices](THIRD_PARTY_NOTICES.md).
