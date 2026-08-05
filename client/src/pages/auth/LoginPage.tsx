import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/api/client';
import { UserRole, enumLabel } from '@/lib/constants';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

// One exemplar per role from server/src/scripts/seed.ts's SEED_USERS — run
// `npm run seed` in server/ to create them. Dev-only: this section never
// renders in a production build (import.meta.env.DEV is stripped at build
// time).
const DEMO_PASSWORD = 'TaskHub@123';
const DEMO_ACCOUNTS: { email: string; role: UserRole }[] = [
  { email: 'ava.whitfield@taskhub.dev', role: UserRole.ADMIN },
  { email: 'marcus.chen@taskhub.dev', role: UserRole.MANAGER },
  { email: 'sofia.novak@taskhub.dev', role: UserRole.TEAMLEAD },
  { email: 'liam.brooks@taskhub.dev', role: UserRole.MEMBER },
  { email: 'owen.baxter@taskhub.dev', role: UserRole.GUEST },
];

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [quickLoginRole, setQuickLoginRole] = useState<UserRole | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const goToDestination = () => {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
    navigate(from, { replace: true });
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      goToDestination();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onQuickLogin = async (account: { email: string; role: UserRole }) => {
    setQuickLoginRole(account.role);
    try {
      await login(account.email, DEMO_PASSWORD);
      goToDestination();
    } catch (error) {
      toast.error(
        `${getErrorMessage(error)} Run "npm run seed" in server/ to create the demo accounts.`,
      );
    } finally {
      setQuickLoginRole(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
            TH
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Sign in to TaskHub</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, enter your details.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="********"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" isLoading={submitting} className="mt-2 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-teal-600 hover:text-teal-500">
            Register
          </Link>
        </p>

        {import.meta.env.DEV && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
              Dev quick login
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.role}
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={quickLoginRole === account.role}
                  disabled={quickLoginRole !== null && quickLoginRole !== account.role}
                  onClick={() => onQuickLogin(account)}
                >
                  {enumLabel(account.role)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
