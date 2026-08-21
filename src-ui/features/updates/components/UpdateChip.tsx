import { deriveUpdate } from '../derive';
import { useUpdates } from '../UpdatesProvider';

/**
 * The version badge next to the wordmark, doubling as the update control: it
 * shows the running version until an update appears, then offers to install it
 * and to restart once installed.
 */
export function UpdateChip() {
  const { status, check, install, restart } = useUpdates();
  const view = deriveUpdate(status);

  const act = () => {
    if (status.state === 'available') return install();
    if (status.state === 'ready') return restart();
    check();
  };

  const className =
    status.state === 'available' || status.state === 'ready'
      ? 'brand-version brand-version-update'
      : 'brand-version';

  if (!view.actionable) {
    return (
      <span className={className} title={view.title}>
        {view.label}
      </span>
    );
  }

  return (
    <button type="button" className={className} title={view.title} onClick={act}>
      {view.label}
    </button>
  );
}
