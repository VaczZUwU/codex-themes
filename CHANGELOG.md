# Changelog

## Unreleased — Custom themes and startup update checks

- Rename the repository to `codex-themes`; retain existing profile and launcher names for compatibility.
- Check public GitHub releases at startup, display a localized notification/settings status, and link to manual installation. Offline startup remains available.
- Support animated GIF, WebP and PNG wallpapers in custom themes, including previews, JSON import/export and restart persistence. Preserve animation bytes instead of flattening them during static optimization.
- Delete older custom themes directly from preview cards with named confirmation; preserve the current appearance when removing an inactive theme.
- Create, edit and delete personal palettes with an optional local wallpaper.
- Save custom themes in the Codex Doki profile without artificial file-size or theme-count limits, and select them from the preview gallery.
- Import and export versioned JSON files containing colors and embedded artwork.
- Automatically optimize wallpapers over 2 MB or 3840 px into WebP at quality 90%, keeping proportions and transparency; keep the original when compression is not smaller or optimization is disabled.
- Show before/after file sizes in the editor. Optimize uploads, JSON imports and existing wallpapers when editing; never modify the original disk file.
- Automatically choose the accent from the wallpaper, with a manual override.
- Validate imports with specific error messages and retain automatic text contrast correction.
- Persist selection alongside themes using durable database transactions and restore it before applying the initial palette.
- Follow the Codex interface language (English and Russian editor labels; English fallback elsewhere).

## 0.1.1 — Install without VS Code

- Bundle the 88-theme catalog: VS Code and the Doki extension are no longer required.
- Download original artwork automatically into a dedicated persistent cache; support offline reuse.
- Launch Codex Doki automatically after a successful installation with Install.cmd.
- Show empty new-chat screenshots separately in the English and Russian READMEs.

## 0.1.0 — Initial experimental release

- Doki theme gallery embedded into Codex Appearance settings.
- Original theme palettes and artwork variants with preview cards and variant counts.
- Automatic UI language matching for 65 locales in the tested Codex build.
- Text contrast correction, reading brightness control and native settings styling.
- Native theme selection disables Doki; inactive selectors show no selection.
- Persistent preferences and explicit reactivation from the Doki gallery.
- Local installer, compatibility check, safe runtime removal and source-only release packaging.

Windows only. Tested with Codex internal version 26.1002.52244 and Doki Theme 88.1.18.
