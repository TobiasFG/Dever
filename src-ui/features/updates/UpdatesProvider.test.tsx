import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsProvider } from '@/features/notifications/store';
import { UpdateChip } from './components/UpdateChip';
import { UpdatesProvider } from './UpdatesProvider';

const { appVersion, checkForUpdate, installUpdate, relaunchApp } = vi.hoisted(() => ({
  appVersion: vi.fn(),
  checkForUpdate: vi.fn(),
  installUpdate: vi.fn(),
  relaunchApp: vi.fn(),
}));
vi.mock('./api', () => ({ appVersion, checkForUpdate, installUpdate, relaunchApp }));

const renderChip = () =>
  render(
    <NotificationsProvider>
      <UpdatesProvider>
        <UpdateChip />
      </UpdatesProvider>
    </NotificationsProvider>,
  );

describe('update chip', () => {
  beforeEach(() => {
    appVersion.mockReset().mockResolvedValue('0.1.0');
    checkForUpdate.mockReset();
    installUpdate.mockReset().mockResolvedValue(undefined);
    relaunchApp.mockReset().mockResolvedValue(undefined);
  });

  it('shows the running version when there is no update', async () => {
    checkForUpdate.mockResolvedValue(null);
    renderChip();
    expect(await screen.findByText('v0.1.0')).toBeTruthy();
  });

  it('offers the update, installs it, then asks for a restart', async () => {
    checkForUpdate.mockResolvedValue({ version: '0.2.0', body: 'Notes' });
    renderChip();

    const offer = await screen.findByText('Update to 0.2.0');
    fireEvent.click(offer);

    expect(installUpdate).toHaveBeenCalledTimes(1);
    const restart = await screen.findByText('Restart to update');

    fireEvent.click(restart);
    expect(relaunchApp).toHaveBeenCalledTimes(1);
  });

  it('reports download progress from the plugin events', async () => {
    checkForUpdate.mockResolvedValue({ version: '0.2.0', body: null });
    // Hold the install open so the progress state stays on screen.
    installUpdate.mockImplementation((_update: unknown, onEvent: (e: unknown) => void) => {
      onEvent({ event: 'Started', data: { contentLength: 1000 } });
      onEvent({ event: 'Progress', data: { chunkLength: 250 } });
      return new Promise(() => {});
    });
    renderChip();

    fireEvent.click(await screen.findByText('Update to 0.2.0'));
    expect(await screen.findByText('Installing 25%')).toBeTruthy();
  });

  it('surfaces a failed check and lets the user retry', async () => {
    checkForUpdate.mockRejectedValue(new Error('endpoint unreachable'));
    renderChip();

    const chip = await screen.findByTitle(/endpoint unreachable/);
    expect(chip.textContent).toBe('v0.1.0');

    checkForUpdate.mockResolvedValue(null);
    fireEvent.click(chip);
    await waitFor(() => expect(checkForUpdate).toHaveBeenCalledTimes(2));
  });

  it('checks once on launch', async () => {
    checkForUpdate.mockResolvedValue(null);
    renderChip();
    await screen.findByText('v0.1.0');
    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });
});
