# Changelog

All notable changes to this project are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and commit
messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

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

[0.2.0]: https://github.com/rolfkleef/firefox-container-homes/releases/tag/v0.2.0
[0.1.0]: https://github.com/rolfkleef/firefox-container-homes/releases/tag/v0.1.0
