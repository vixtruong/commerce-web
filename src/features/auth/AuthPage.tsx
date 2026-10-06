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
import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const register = location.pathname === '/register';
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="auth-page">
      <Link to="/products" className="auth-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the collection
      </Link>
      <section className="auth-form" aria-labelledby="auth-heading">
        <p className="eyebrow">Your Commerce account</p>
        <h1 id="auth-heading">{register ? messages.createYourAccount : messages.welcomeBack}</h1>
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
          <div className="password-field">
            <Input
              label={messages.password}
              type={showPassword ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              {...form.register('password')}
              error={form.formState.errors.password?.message}
              hint={register ? messages.passwordHint : undefined}
            />
            <button
              className="icon-button password-toggle"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
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
