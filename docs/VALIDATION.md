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
