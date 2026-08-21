import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import { useNotifications } from '@/features/notifications/store';
import { appVersion, checkForUpdate, installUpdate, relaunchApp } from './api';
import type { UpdateStatus } from './types';

type UpdatesContextValue = {
  status: UpdateStatus;
  /** Ask the endpoint whether a newer release exists. */
  check: () => void;
  /** Download and install the pending update, then offer the relaunch. */
  install: () => void;
  /** Restart into the installed version. */
  restart: () => void;
};

const UpdatesContext = createContext<UpdatesContextValue | null>(null);

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return String(e);
}

/**
 * Owns the update flow app-wide: checks once on launch, keeps the pending
 * `Update` handle around so the user can install it whenever they like, and
 * announces new versions through the notification center.
 *
 * The check is a no-op in `tauri dev` — there is no installed bundle to replace
 * — so a failure here is reported quietly and never blocks the app.
 */
export function UpdatesProvider({ children }: { children: ReactNode }) {
  const { notify } = useNotifications();
  const [status, setStatus] = useState<UpdateStatus>({
    state: 'idle',
    version: '',
    newVersion: null,
    notes: null,
    progress: null,
    error: null,
  });
  // The plugin's Update handle isn't render state — it's the thing we install.
  const pending = useRef<Update | null>(null);
  // A launch check runs once; StrictMode mounts effects twice in development.
  const checkedOnLaunch = useRef(false);

  useEffect(() => {
    let active = true;
    void appVersion().then((v) => active && setStatus((s) => ({ ...s, version: v })));
    return () => {
      active = false;
    };
  }, []);

  const install = useCallback(() => {
    const update = pending.current;
    if (!update) return;
    setStatus((s) => ({ ...s, state: 'installing', progress: { downloaded: 0, total: null } }));

    let downloaded = 0;
    let total: number | null = null;
    void installUpdate(update, (event) => {
      if (event.event === 'Started') {
        total = event.data.contentLength ?? null;
      } else if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
      }
      setStatus((s) => ({ ...s, progress: { downloaded, total } }));
    })
      .then(() => {
        setStatus((s) => ({ ...s, state: 'ready', progress: null }));
        notify({
          kind: 'success',
          title: `Dever ${update.version} installed`,
          body: 'Restart to finish updating.',
          actionLabel: 'Restart',
          onAction: () => void relaunchApp(),
        });
      })
      .catch((e) => {
        setStatus((s) => ({ ...s, state: 'error', progress: null, error: errorMessage(e) }));
        notify({ kind: 'error', title: 'Update failed', body: errorMessage(e) });
      });
  }, [notify]);

  // Defined after `install` so the "update available" notification can offer it
  // as an action.
  const check = useCallback(() => {
    setStatus((s) => ({ ...s, state: 'checking', error: null }));
    void checkForUpdate()
      .then((update) => {
        pending.current = update;
        if (!update) {
          setStatus((s) => ({ ...s, state: 'idle', newVersion: null, notes: null }));
          return;
        }
        setStatus((s) => ({
          ...s,
          state: 'available',
          newVersion: update.version,
          notes: update.body ?? null,
        }));
        notify({
          kind: 'info',
          title: `Dever ${update.version} is available`,
          body: update.body ?? 'Click to install and restart.',
          actionLabel: 'Install',
          onAction: install,
        });
      })
      .catch((e) => {
        setStatus((s) => ({ ...s, state: 'error', error: errorMessage(e) }));
      });
  }, [notify, install]);

  useEffect(() => {
    if (checkedOnLaunch.current) return;
    checkedOnLaunch.current = true;
    check();
  }, [check]);

  const restart = useCallback(() => void relaunchApp(), []);

  const value = useMemo<UpdatesContextValue>(
    () => ({ status, check, install, restart }),
    [status, check, install, restart],
  );

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export function useUpdates(): UpdatesContextValue {
  const ctx = useContext(UpdatesContext);
  if (!ctx) throw new Error('useUpdates must be used within an UpdatesProvider');
  return ctx;
}
