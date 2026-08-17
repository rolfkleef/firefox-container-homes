# Container Homes

A minimal Firefox extension that opens a configured home URL for the current
container (Multi-Account Containers), and gives each container up to 9
Ferdium/Franz-style app slots you switch to (or open) with a keyboard
shortcut.

## Features

- Set a different home URL per container (plus one for "No container / Default").
  Click the toolbar button, or press **Alt+Shift+Home**, to load that
  container's home URL in the current tab.
- Set up to 9 app slot URLs per container. Press **Alt+Shift+1** through
  **Alt+Shift+9** to switch to that slot's tab — scoped to whichever
  container is currently active — or open it in a new tab if it isn't
  already open. If the tab lives in another window, that window is raised
  too.
- Slots remember the exact tab they last switched to (not just a URL
  pattern), so navigating around inside an app (e.g. different Slack
  channels or Gmail threads) doesn't break the binding. If that tab is
  closed or the browser restarts, the next press falls back to matching by
  the slot URL's origin, or opens a fresh tab if nothing matches.

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
2. Enter a home URL, and a URL for any slots you want, for each container.
3. Click the toolbar button, or press **Alt+Shift+Home** in any tab, to jump
   to that container's home URL. Press **Alt+Shift+1**..**9** to switch to
   (or open) that container's slot.
4. Change the keyboard shortcuts via the extensions page (`about:addons` -
   click the cog in the top-right - choose "Manage Extension Shortcuts").
   Note that Firefox only auto-assigns a command's `suggested_key` the
   *first* time that command is introduced to an installed copy of the
   extension — if you add new commands to an already-loaded extension (e.g.
   during development) and just reload it, the new shortcuts come up
   unbound until you set them here, or remove and re-load the temporary
   add-on from scratch.

## Permissions

- `activeTab` — read the current tab's container and navigate it to
  the configured URL.
- `tabs` — find a slot's existing tab (by remembered id, or by URL as a
  fallback) across all of a container's tabs, and re-focus its window.
- `cookies` — required by Firefox to open a new tab in a specific container
  (`tabs.create` with `cookieStoreId`) when a slot's tab isn't already open.
- `contextualIdentities` — list your Firefox containers on the options page.
- `storage` — save your configured URLs locally, and remember which tab
  each slot last switched to for the current browser session.

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

The add-on is submitted to AMO through two tracks, and they share one rule:
**version numbers must be unique across both**, so each version belongs to
exactly one of them.

### Unlisted (GitHub releases, built by CI)

Use a pre-release version — Firefox's own `a`/`b`/`pre`/`rc` + number suffix
(e.g. `0.3.0a1`, `0.3.0a2`, ...), not semver's `-beta.1` style, which Firefox
doesn't accept.

1. Bump `"version"` in `manifest.json` (and `package.json`) to a pre-release,
   e.g. `0.3.0a1`.
2. Commit, then tag and push: `git tag vX.Y.ZaN && git push origin vX.Y.ZaN`.
3. GitHub Actions lints the extension, verifies the tag matches the manifest
   version, signs it via
   [addons.mozilla.org](https://addons.mozilla.org)'s unlisted-signing API,
   and attaches the signed `.xpi` to a new GitHub release.

This requires the `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` repository secrets,
generated at
[addons.mozilla.org/developers/addon/api/key](https://addons.mozilla.org/developers/addon/api/key/).

### Listed (public AMO submission, built and submitted by hand)

Use a clean version number (e.g. `0.3.0`) — no pre-release suffix.

1. Bump `"version"` in `manifest.json` (and `package.json`).
2. Commit and push to `main` — **don't tag it**, since CI would try to sign a
   version number that's about to be manually submitted to a different
   channel.
3. Run `npm run build` and upload the resulting `.zip` through the AMO web
   UI (Developer Hub → Submit a New Add-on → "On this site").
4. Once submitted, tag it for the record — `git tag vX.Y.Z && git push origin
   vX.Y.Z` — CI detects the version has no pre-release suffix and skips the
   signing/release steps automatically.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
