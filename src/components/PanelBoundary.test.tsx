import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { PanelBoundary } from './PanelBoundary';

it('keeps other workspace sections available without exposing a failed section exception', async () => {
  const logging = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  let failed = true;
  function Chart() {
    if (failed) throw new Error('private implementation details');
    return <h2>Chart recovered</h2>;
  }
  try {
    render(
      <>
        <h1>Other workspace section</h1>
        <PanelBoundary>
          <Chart />
        </PanelBoundary>
      </>,
    );
    expect(screen.getByText('Other workspace section')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('This section could not be displayed.');
    expect(screen.queryByText('private implementation details')).not.toBeInTheDocument();
    failed = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Chart recovered')).toBeVisible();
  } finally {
    logging.mockRestore();
  }
});
