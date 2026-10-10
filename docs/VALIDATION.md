# Local validation — 0.1.1 candidate

Validated on Windows, 2026-10-10:

- 10 Python installer tests passed: packed archive replacement, existing entry preservation,
  SHA-256 integrity, malformed archives, path traversal, offline asset behavior,
  synthetic installation/removal and removal guards, the bundled catalog without VS Code,
  and automatic artwork caching for offline reuse.
- JavaScript syntax check passed.
- Automatic discovery and compatibility check passed against the installed Codex and Doki versions
  in the compatibility table: 88 themes, 103 images, 65 interface locales.
- The installer archive builder patched a real Codex ASAR in a separate output file. All 105 inserted
  files were read back and compared; their SHA-256 hashes and executable header-hash replacement matched.
- Release UI source, generated theme catalog and generated locale catalog were compared with the
  working desktop copy and matched exactly.
- The working UI was exercised for native theme deactivation (including a Codex submenu preset),
  native mode selection, reload persistence, inactive selection labels, unselected gallery state,
  and reactivation by choosing the previously used Doki theme.
- The release ZIP contains only allowlisted source/documentation/workflow files. It contains no
  Codex binaries, ASAR archives, artwork PNGs, native translation catalogs, account data or machine paths.

**Still required before calling this a fully validated installer:** a complete fresh install/launch/remove
cycle on a machine with sufficient free space. This cycle could not be completed locally because a second
runtime copy would exceed available disk space. The original Codex installation remained unchanged.

GitHub CI checks run on Windows and Linux when changes are pushed.
The release should remain an experimental prerelease while this final installation check is pending.

## Custom-theme development checks

- Browser regression tests cover palette creation, original image preservation, persistence across reloads, renaming, JSON export/import, rejected remote images/invalid colors/duplicate preset names, English/Russian editor labels, native theme deactivation, gallery reactivation, deletion and preservation through settings reset.
- A separate test completely closes and launches Chromium with the same on-disk profile: themes, selection and manual/automatic accent preferences restore. It also removes the localStorage selection to verify restoration from the durable database, accepts an image over 8 MB without downscaling and creates a collection exceeding the old 50-theme limit.
- With optimization disabled, the original image bytes are preserved. With optimization enabled, the same 9 MB test image is stored as WebP at 3840 px and less than 1% of the test input size; disabling it before saving restores the original draft. Accent and full-restart persistence still pass. This synthetic image includes padding, so its compression ratio is not a promise for normal artwork.
- Uploaded pictures and JSON imports are stored locally in IndexedDB. The existing CSP permits blob/data images; no CSP changes are required.
- Updated the isolated working desktop copy and visually inspected the Russian editor inside the native Appearance settings at 100% zoom.
- Selected the existing custom Honkai theme in the real Codex copy, stopped all processes belonging to that isolated runtime and launched it again: its purple custom palette restored on the new-chat screen.
- Browser editor snapshots use a controlled test fixture and are kept as local QA artifacts; they are not presented as native-app screenshots in the README.

## Startup update checks

- Node tests verify numeric version comparisons, draft exclusion, numeric prereleases, trusted release URLs, anonymous requests, malformed responses, rate limits and timeouts.
- Browser tests verify the update notification, release link, Russian translation, dismissal and settings status.
- Patched and restarted the isolated desktop runtime. Its main process successfully fetched releases from `VaczZUwU/codex-themes` and persisted the startup-check cache in the existing profile.
- The native renderer CSP remains unchanged; the main process performs the network check.

- Animated background tests use synthetic two-frame looping GIF, WebP and APNG fixtures wider than the optimization threshold. Upload, export/import, editing and full Chromium restarts preserve every original byte with optimization enabled.
