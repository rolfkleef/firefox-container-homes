# Container Homes

A minimal Firefox extension that opens a configured home URL for the current
container (Multi-Account Containers), from a toolbar button or a keyboard
shortcut.

## Features

- Set a different home URL per container (plus one for "No container / Default").
- Click the toolbar button, or press **Alt+Shift+Home**, to load that
  container's home URL in the current tab.

## Installing

### From a release

Grab the signed `.xpi` from the
[Releases page](https://github.com/rolfkleef/firefox-container-homes/releases)
and open it in Firefox to install it.

### Temporarily, for development

Open `about:debugging#/runtime/this-firefox` in Firefox, choose
**Load Temporary Add-on**, and select `manifest.json`. The extension is
removed when Firefox restarts.

## Usage

1. Open the extension's options page (`about:addons` → Container Homes →
   *Preferences*).
2. Enter a home URL for each container you want one for.
3. Click the toolbar button, or press **Alt+Shift+Home** in any tab, to jump
   to that container's home URL.
4. Change the keyboard shortcut via the extensions page (`about:addons` -
   click the cog in the top-right - choose "Manage Extension Shortcuts")

## Permissions

- `tabs` / `activeTab` — read the current tab's container and navigate it to
  the configured URL.
- `contextualIdentities` — list your Firefox containers on the options page.
- `storage` — save your configured URLs locally.

No data leaves your device.

## Development

```sh
npm install
npm run lint    # validate manifest.json and extension source
npm start       # run in a temporary Firefox profile
npm run build   # produce an unsigned .zip in web-ext-artifacts/
```

> `npm start` needs a Firefox binary that `web-ext` can open a debugger
> connection to. It does not work with Ubuntu's Firefox *snap* package, which
> sandboxes `/tmp` and blocks the connection — use the manual
> `about:debugging` steps above instead if that's your setup.

## Releasing

Releases are built and signed by CI:

1. Bump `"version"` in `manifest.json`.
2. Commit, then tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. GitHub Actions lints the extension, verifies the tag matches the manifest
   version, signs it via
   [addons.mozilla.org](https://addons.mozilla.org)'s unlisted-signing API,
   and attaches the signed `.xpi` to a new GitHub release.

This requires the `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repository secrets,
generated at
[addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/developers/addon/api/key/).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
