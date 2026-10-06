import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { it, expect } from 'vitest';
import AuthPage from './AuthPage';
it('shows accessible validation before sending invalid login credentials', async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
});
it('reveals and hides the entered password without submitting the form', async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/login']}>
        <AuthPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const password = screen.getByLabelText('Password');
  await userEvent.type(password, 'PrivateExample123!');
  await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(password).toHaveAttribute('type', 'text');
  expect(password).toHaveValue('PrivateExample123!');
  expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(password).toHaveAttribute('type', 'password');
  expect(password).toHaveValue('PrivateExample123!');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
