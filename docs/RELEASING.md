# Release checklist

1. Keep `VERSION` and `install.py`'s `VERSION` synchronized. Update `CHANGELOG.md` and the tested
   compatibility table. Treat a new Codex build as unverified until exercised in the app.
2. Run `python -m unittest discover -s tests -v` and `node --check src/doki.js`.
3. On Windows, run `python install.py check`, then a fresh installation to an empty test directory.
   Launch that copy and verify Appearance integration, artwork, chat/code contrast, native theme
   deactivation, inactive selection and Doki reactivation. Remove the test runtime afterward.
4. Run `python scripts/package_release.py`. Inspect the ZIP file list and `SHA256SUMS.txt`.
   It must contain no runtime, PNG assets, generated translations, chats, account data or machine paths.
5. Commit/push this source project to the chosen GitHub repository. After reviewing the diff, push
   a version tag such as `v0.1.0`. The workflow runs checks and creates a draft prerelease with ZIP/checksum.
6. Review release notes and downloadable files in GitHub before publishing the draft.

Never upload `runtime/`, `app.asar`, Codex executables, `.codex`, generated localization catalogs,
or the local install marker. The release script uses an explicit file list rather than zipping the workspace.

Suggested repository name: `codex-doki`. Suggested first release title: `v0.1.0 — Doki themes for Codex (Windows preview)`.
