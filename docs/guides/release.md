# Release a version

Dever ships as a Windows installer attached to a GitHub release, and every installed copy
updates itself from that release. This is the whole procedure.

## Cut a release

1. Bump the version in **three** files — they must match:
   - `src-tauri/tauri.conf.json` → `version` (the authoritative one; the tag and the
     updater both read it)
   - `package.json` → `version`
   - `src-tauri/Cargo.toml` → `version`
2. Commit the bump, then tag and push:

   ```bash
   git tag dever-v0.2.0
   git push origin dever-v0.2.0
   ```

3. `.github/workflows/release.yml` builds the bundles, signs them for the updater, and
   attaches everything to a **draft** release.
4. Check the assets, then **publish** the release on GitHub.

Publishing is the ship gate: the updater reads
`https://github.com/TobiasFG/Dever/releases/latest/download/latest.json`, and that URL only
resolves for a published, non-prerelease release. A draft reaches nobody.

## How updating works

- `bundle.createUpdaterArtifacts` makes Tauri emit a signed `.sig` next to each installer.
  `tauri-action` collects those into `latest.json`.
- On launch, `UpdatesProvider` (`src-ui/features/updates/`) checks the endpoint once. If a
  newer version exists, the version chip beside the wordmark turns into **Update to x.y.z**
  and a notification offers the same action. Installing downloads the NSIS setup, runs it in
  `passive` mode (progress bar, no prompts), then offers the relaunch.
- The installer is per-user (`nsis.installMode: "currentUser"`, into `%LOCALAPPDATA%`), so
  updates need no admin rights and raise no UAC prompt.
- Signature verification is mandatory and cannot be disabled: an update that isn't signed by
  our private key is refused.

Updates don't work in `bun run desktop` — there's no installed bundle to replace. The check
fails quietly there; test the real flow with an installed build.

## The signing key

`TAURI_SIGNING_PRIVATE_KEY` signs the artifacts; the matching public key sits in
`src-tauri/tauri.conf.json` under `plugins.updater.pubkey`. The key has no passphrase, so
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD` is unset — an unset secret arrives as the empty
string, which is what a passphrase-less key expects.

**If the private key is lost, no installed copy can ever be updated again** — they'd all
have to reinstall by hand. Rotating it means replacing every existing install manually, so
treat that as a last resort.

It must therefore live in two places:

- GitHub repository secrets, so CI can sign. Write-only — you cannot read it back out, so
  this does not count as a backup.
- A durable store outside this repo and outside any one laptop, so a human can recover it.
  **TODO: name the actual store here** (team password manager, Azure Key Vault, …) once
  the key has been filed in one. As of the 0.1.0 keypair, this step is outstanding — the
  only copy is `~/.tauri/dever.key` on the machine that generated it.

## SmartScreen

The installers are not code-signed, so Windows shows "Windows protected your PC" on the
first manual install — **More info → Run anyway**. Updates after that are silent. To remove
the warning, sign the bundles with Azure Artifact Signing (formerly Trusted Signing, ~$10
per month, requires a verified business) via `bundle.windows.signCommand`; see
[Tauri's Windows signing docs](https://v2.tauri.app/distribute/sign/windows/). An OV
certificate does *not* remove the warning until it accrues reputation; only EV or Azure
Public Trust does.

## Adding platforms

The release matrix builds Windows only, because that's what the team runs. Add a
`macos-latest` row (with `--target aarch64-apple-darwin`) or `ubuntu-22.04` to
`.github/workflows/release.yml`; the updater handles those bundles identically. macOS also
needs notarization before it will install cleanly elsewhere.

## If a release goes wrong

- **Draft looks wrong** — delete the draft release and the tag, fix, re-tag.
- **Published a bad version** — publish a higher version. The updater only moves forward, so
  rolling back means shipping a new version number with the old content.
- **`latest.json` missing from the release** — the signing secrets weren't set, so no updater
  artifacts were produced. Set them and re-run the workflow.
