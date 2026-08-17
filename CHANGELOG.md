# Changelog

All notable changes to this project are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and commit
messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Unreleased

### Features

- Add per-container app slots (1-9): `Alt+Shift+1`..`9` switch to that
  slot's tab in the current container, or open its configured URL in a new
  tab if it isn't already open. Bindings track the actual tab, with
  URL-origin matching as a fallback after the tab closes or the browser
  restarts, and raise the target window if it lives elsewhere.
- Add config export/import on the options page: export home URLs and slots
  to a JSON file, and import one back in (replacing the current
  configuration, after a confirmation prompt).

### Chores

- Store a `configVersion` alongside the config, so future schema changes can
  migrate on update instead of guessing at the stored shape.
- Re-add the `tabs` permission, needed to find and re-focus slot tabs by id
  or URL.
- Add the `cookies` permission, required by `tabs.create`'s `cookieStoreId`
  option — without it, opening a new tab for an unconfigured slot silently
  fails.

## [0.2.2] - 2026-08-13

### Fixes

- Drop the unneeded `tabs` permission (`activeTab` already covers it,
  since both entry points are user-gesture-triggered).
- Widen the container name labels in the options page for more room.

## 0.2.1 - 2026-08-12

### Chores

- Bump version for manual submission to the AMO public listing. No
  functional changes.

## [0.2.0] - 2026-08-12

### Fixes

- Show each container's icon and color in the options list, pulled from
  `contextualIdentities`, to match Firefox's native container styling.

## [0.1.0] - 2026-08-12

### Features

- Initial version of the extension: configure a home URL per Firefox
  container, and jump to it from the toolbar button or Alt+Shift+Home.
- Tag-triggered CI pipeline that lints, signs via AMO, and publishes a
  GitHub release.

### Fixes

- Embed the options page in the addon's details view (`about:addons`)
  instead of opening it in a separate tab.

### Refactoring

- Reorganize the source into a `src/` layout and migrate to Manifest V3.

### Chores

- Rename the extension to "Container Homes" and pluralize the remaining
  singular identifiers (extension id, package name, command id).
- Add an MIT license.

### Documentation

- Add a README covering installation, usage, permissions, development, and
  the release process.

[0.2.2]: https://github.com/rolfkleef/firefox-container-homes/releases/tag/v0.2.2
[0.2.0]: https://github.com/rolfkleef/firefox-container-homes/releases/tag/v0.2.0
[0.1.0]: https://github.com/rolfkleef/firefox-container-homes/releases/tag/v0.1.0
