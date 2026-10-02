import { messages } from '../../lib/messages';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, saveTokens } from '../../api/client';
import { queryClient } from '../../app/query';
import { safeDestination } from '../../auth/permissions';
import { loginSchema, registrationSchema, type Credentials } from './schemas';
import { Input } from '../../components/FormField';
import { ErrorState } from '../../components/Feedback';
import { applyServerErrors } from '../../lib/formErrors';
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const register = location.pathname === '/register';
  const form = useForm<Credentials>({ resolver: zodResolver(register ? registrationSchema : loginSchema) });
  const mutation = useMutation({
    mutationFn: (body: Credentials) =>
      api<unknown>('/api/auth/' + (register ? 'register' : 'login'), {
        method: 'POST',
        body,
        authenticated: false,
      }),
    onSuccess: (tokens) => {
      saveTokens(tokens, true);
      queryClient.clear();
      const state: unknown = location.state;
      const from = typeof state === 'object' && state !== null && 'from' in state ? state.from : undefined;
      navigate(safeDestination(from), { replace: true });
    },
    onError: (error) => applyServerErrors(error, form.setError, ['email', 'password']),
  });
  return (
    <div className="auth-grid">
      <section className="auth-editorial">
        <span className="eyebrow">Commerce / Your account</span>
        <h1>
          Good things,
          <br />
          all in one place.
        </h1>
        <p>Your selection. Your orders. A workspace made yours.</p>
        <Link to="/products" className="text-link">
          Explore the collection →
        </Link>
      </section>
      <section className="auth-form">
        <h2>{register ? messages.createYourAccount : messages.welcomeBack}</h2>
        <p>{register ? messages.saveYourCart : messages.signInContinue}</p>
        <form onSubmit={form.handleSubmit((body) => mutation.mutate(body))} noValidate>
          <Input
            label={messages.emailAddress}
            type="email"
            autoComplete="email"
            required
            {...form.register('email')}
            error={form.formState.errors.email?.message}
          />
          <Input
            label={messages.password}
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            {...form.register('password')}
            error={form.formState.errors.password?.message}
            hint={register ? messages.passwordHint : undefined}
          />
          {mutation.error && <ErrorState error={mutation.error} />}
          <button className="button full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? messages.pleaseWait : register ? messages.createAccount : messages.signIn}
          </button>
        </form>
        <p className="small">
          {register ? messages.alreadyRegistered : messages.newToCommerce}{' '}
          <Link className="text-link" to={register ? '/login' : '/register'} state={location.state}>
            {register ? messages.signIn : 'Create an account'}
          </Link>
        </p>
      </section>
    </div>
  );
}
