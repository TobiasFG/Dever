/** Where the update flow currently is. Drives everything the version chip shows.
 *
 * - `idle`      — nothing to do; the running version is the newest one we know of
 * - `checking`  — asking the endpoint
 * - `available` — a newer version exists and is waiting for the user to say go
 * - `installing`— downloading and installing; `progress` is filled in
 * - `ready`     — installed, waiting for the relaunch
 * - `error`     — the check or the install failed; `error` holds the message
 */
export type UpdateState = 'idle' | 'checking' | 'available' | 'installing' | 'ready' | 'error';

/** Download progress of an update in flight. `total` is `null` when the server
 * doesn't report a content length, which makes the percentage unknowable. */
export type UpdateProgress = {
  downloaded: number;
  total: number | null;
};

/** Everything the UI knows about updates. `version` is the running app version;
 * `newVersion` is the one on offer, when there is one. */
export type UpdateStatus = {
  state: UpdateState;
  version: string;
  newVersion: string | null;
  notes: string | null;
  progress: UpdateProgress | null;
  error: string | null;
};
