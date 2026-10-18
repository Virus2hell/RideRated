import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fieldErrors } from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/ui/FormField';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });

  if (user) return <Navigate to="/" replace />;

  const errors = fieldErrors(login.error);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    login.mutate(form, { onSuccess: () => navigate(location.state?.from ?? '/', { replace: true }) });
  };

  return (
    <AuthLayout title="Welcome back, rider" subtitle="Log in to rate roads, like and comment.">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Email" name="email" type="email" value={form.email} onChange={update} error={errors.email?.[0]} required />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={update} error={errors.password?.[0]} required />
        {login.isError && !Object.keys(errors).length && <p className="text-sm text-red-400">{errorMessage(login.error)}</p>}
        <button disabled={login.isPending} className="btn-primary w-full py-3">
          {login.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-zinc-400">
        New here? <Link to="/register" className="font-semibold text-brand-400 hover:underline">Join the pack</Link>
      </p>
    </AuthLayout>
  );
}
