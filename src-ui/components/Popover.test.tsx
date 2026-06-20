import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Popover } from './Popover';

function Fixture() {
  return (
    <div>
      <span data-testid="outside">outside</span>
      <Popover trigger={({ toggle }) => <button onClick={toggle}>open</button>}>
        {() => <div data-testid="panel">panel</div>}
      </Popover>
    </div>
  );
}

describe('Popover', () => {
  it('toggles the panel from the trigger', () => {
    render(<Fixture />);
    expect(screen.queryByTestId('panel')).toBeNull();
    fireEvent.click(screen.getByText('open'));
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<Fixture />);
    fireEvent.click(screen.getByText('open'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('panel')).toBeNull();
  });

  it('closes on outside pointerdown but stays open for inside clicks', () => {
    render(<Fixture />);
    fireEvent.click(screen.getByText('open'));
    fireEvent.pointerDown(screen.getByTestId('panel'));
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId('outside'));
    expect(screen.queryByTestId('panel')).toBeNull();
  });
});
