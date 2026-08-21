import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type DownloadEvent, type Update } from '@tauri-apps/plugin-updater';

/**
 * The updater talks to GitHub Releases rather than to our Rust backend, so this
 * module wraps the plugin instead of `invoke()` — but it stays the single place
 * the frontend reaches for update machinery, same as every other feature's
 * `api.ts`.
 */

/** The version of the running app, from the bundle metadata. */
export const appVersion = () => getVersion();

/** The pending update, or `null` when the running version is already current. */
export const checkForUpdate = (): Promise<Update | null> => check();

/** Download and install `update`, reporting download progress as it goes. */
export const installUpdate = (update: Update, onEvent: (e: DownloadEvent) => void) =>
  update.downloadAndInstall(onEvent);

/** Restart into the freshly installed version. */
export const relaunchApp = () => relaunch();
