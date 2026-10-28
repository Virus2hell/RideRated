import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fieldErrors } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/ui/FormField';
import PendingNotice from '../components/ui/PendingNotice';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });

  if (user) return <Navigate to="/" replace />;

  const busy = register.isPending;
  const errors = fieldErrors(register.error);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (busy) return; // ignore double submits
    register.mutate(form, { onSuccess: () => navigate('/', { replace: true }) });
  };

  return (
    <AuthLayout title="Join the pack" subtitle="Free forever. Takes 30 seconds.">
      <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
        {/* A disabled fieldset disables every input and button inside it while the account is created */}
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-70">
          <FormField label="Name" name="displayName" value={form.displayName} onChange={update} error={errors.displayName?.[0]} required />
          <FormField label="Username" name="username" value={form.username} onChange={update} error={errors.username?.[0]} hint="Letters, numbers, _ and . only" required />
          <FormField label="Email" name="email" type="email" value={form.email} onChange={update} error={errors.email?.[0]} required />
          <FormField label="Password" name="password" type="password" value={form.password} onChange={update} error={errors.password?.[0]} minLength={8} hint="At least 8 characters" required />
          {register.isError && !Object.keys(errors).length && <p className="text-sm text-red-400">{errorMessage(register.error)}</p>}
          <button className="btn-primary w-full py-3">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </fieldset>
        {busy && <PendingNotice message="Please wait, we're creating your account…" />}
      </form>
      <p className="mt-6 text-sm text-zinc-400">
        Already riding with us?{' '}
        {busy ? (
          <span className="cursor-not-allowed font-semibold text-zinc-600" aria-disabled="true">Log in</span>
        ) : (
          <Link to="/login" className="font-semibold text-brand-400 hover:underline">Log in</Link>
        )}
      </p>
    </AuthLayout>
  );
}