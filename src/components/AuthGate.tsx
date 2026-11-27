import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { FinTrackerLogo } from './FinTrackerLogo';
import { supabase } from '../lib/supabase';

interface AuthGateProps {
  recoveryMode?: boolean;
  initialError?: string | null;
  onRecoveryComplete?: () => void;
  onCancelRecovery?: () => Promise<void> | void;
}

interface EmailCheckResult {
  registered?: boolean;
  rate_limited?: boolean;
  invalid?: boolean;
}

const PREVIEW_ROWS = [
  {
    date: 'Nov 26',
    title: 'Fresh Market Groceries',
    category: 'Groceries',
    amount: '$48.20',
    color: '#2DD4BF',
  },
  {
    date: 'Nov 25',
    title: 'Morning Espresso & Pastry',
    category: 'Food & Dining',
    amount: '$9.50',
    color: '#34D399',
  },
  {
    date: 'Nov 24',
    title: 'Metro Rail Pass',
    category: 'Transport',
    amount: '$24.00',
    color: '#38BDF8',
  },
] as const;

function formatSupabaseAuthError(message: string, code?: string): string {
  const lower = message.toLowerCase();
  if (
    code === 'over_email_send_rate_limit' ||
    lower.includes('rate limit') ||
    lower.includes('email limit')
  ) {
    return 'Too many email requests have been sent recently. Please wait a little while and try again.';
  }
  return message;
}

export function AuthGate({
  recoveryMode = false,
  initialError = null,
  onRecoveryComplete,
  onCancelRecovery,
}: AuthGateProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [notice, setNotice] = useState<string | null>(null);
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  function resetFormMessages() {
    setError(null);
    setNotice(null);
    setUnregisteredEmail(null);
  }

  function handleModeChange(nextMode: 'signin' | 'signup') {
    if (nextMode === mode) {
      return;
    }
    setMode(nextMode);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetFormMessages();
  }

  function openForgotPassword() {
    setMode('forgot');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetFormMessages();
  }

  function switchToSignUpWithEmail(targetEmail: string) {
    setMode('signup');
    setEmail(targetEmail);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetFormMessages();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    resetFormMessages();

    if (recoveryMode) {
      if (password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });
        if (updateError) {
          setError(updateError.message);
          return;
        }
        setPassword('');
        setConfirmPassword('');
        onRecoveryComplete?.();
      } finally {
        setLoading(false);
      }
      return;
    }

    const trimmedEmail = email.trim();

    if (mode === 'forgot') {
      if (!trimmedEmail) {
        setError('Enter your email address.');
        return;
      }

      setLoading(true);
      try {
        const { data, error: fnError } =
          await supabase.functions.invoke<EmailCheckResult>(
            'check-email-registered',
            {
              body: { email: trimmedEmail },
            }
          );

        if (fnError) {
          setError(
            'Unable to verify email registration right now. Please try again in a moment.'
          );
          return;
        }

        const result = (data ?? {}) as EmailCheckResult;
        if (result.invalid) {
          setError('Enter a valid email address.');
          return;
        }

        if (result.rate_limited) {
          setError(
            'Too many reset checks from your network. Please wait 15 minutes before trying again.'
          );
          return;
        }

        if (!result.registered) {
          setUnregisteredEmail(trimmedEmail);
          return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          trimmedEmail,
          { redirectTo: window.location.origin }
        );

        if (resetError) {
          setError(formatSupabaseAuthError(resetError.message, resetError.code));
          return;
        }

        setNotice(
          `We sent a password reset link to ${trimmedEmail}. Check your inbox to set a new password.`
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!trimmedEmail || !password) {
      setError('Enter both your email address and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setError(formatSupabaseAuthError(signInError.message, signInError.code));
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) {
          setError(formatSupabaseAuthError(signUpError.message, signUpError.code));
        } else if (!data.session) {
          setNotice(
            'Account created. Check your inbox to confirm your email before signing in.'
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#0B0E11] text-[#F1F5F9] flex items-center justify-center px-4 sm:px-8 py-10"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 65% 45% at 20% 18%, rgba(52, 211, 153, 0.07), transparent 70%)',
      }}
    >
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <section
          aria-label="FinTracker overview"
          className="hidden lg:flex lg:col-span-7 flex-col justify-center space-y-7 pr-4"
        >
          <div className="space-y-4">
            <FinTrackerLogo size="lg" />
            <h2 className="font-display text-3xl xl:text-[38px] font-semibold tracking-tight leading-[1.15] text-[#F1F5F9] [text-wrap:balance] max-w-lg">
              Track daily spending with calm clarity.
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed max-w-md">
              Record everyday expenses in seconds, switch cleanly across USD, THB, and MMK, and understand where each month goes.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="border border-[#222A32] bg-[#13181D] rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#222A32] px-5 py-3 bg-[#0F1419]">
              <span className="text-xs font-medium text-[#F1F5F9]">
                November 2026
              </span>
              <span className="text-[11px] font-mono-tabular text-[#7C8896]">
                USD · THB · MMK
              </span>
            </div>

            <div className="grid grid-cols-3 border-b border-[#222A32] divide-x divide-[#222A32]">
              <div className="p-4">
                <p className="text-[11px] font-medium text-[#94A3B8]">
                  Total Spent
                </p>
                <p className="mt-1.5 font-display text-xl font-semibold text-[#F1F5F9] tabular-nums">
                  $1,284.50
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#34D399]">
                  -8.4% vs last month
                </p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-medium text-[#94A3B8]">
                  Daily Average
                </p>
                <p className="mt-1.5 font-mono-tabular text-xl font-semibold text-[#F1F5F9]">
                  $42.82
                </p>
                <p className="mt-1 text-[11px] text-[#7C8896]">30 days</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-medium text-[#94A3B8]">
                  Top Category
                </p>
                <p className="mt-1.5 text-base font-semibold text-[#F1F5F9] truncate">
                  Groceries
                </p>
                <p className="mt-1.5 text-[11px] font-mono-tabular text-[#7C8896]">
                  $412.40
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#222A32]/80 notebook-ruled">
              {PREVIEW_ROWS.map((row) => (
                <div
                  key={row.title}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono-tabular text-xs text-[#7C8896] w-12 shrink-0">
                      {row.date}
                    </span>
                    <span
                      className="h-2 w-2 rounded-xs shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#F1F5F9] truncate">
                        {row.title}
                      </p>
                      <p className="text-[11px] text-[#7C8896] truncate">
                        {row.category}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-[#F1F5F9] shrink-0">
                    {row.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#7C8896]">
            Private cloud sync · Fixed multi-currency rates · Instant CSV &amp; JSON export
          </p>
        </section>

        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md border border-[#222A32] bg-[#13181D] rounded-lg p-7 sm:p-8">
            <div className="border-b border-[#222A32] pb-5">
              <div className="lg:hidden mb-3">
                <FinTrackerLogo size="md" />
              </div>
              <h1 className="font-display text-xl font-semibold tracking-tight text-[#F1F5F9]">
                {recoveryMode
                  ? 'Set a new password'
                  : mode === 'forgot'
                    ? 'Reset your password'
                    : mode === 'signup'
                      ? 'Create your notebook'
                      : 'Welcome back'}
              </h1>
              <p className="mt-1.5 text-sm text-[#94A3B8]">
                {recoveryMode
                  ? 'Choose a new password for your FinTracker account.'
                  : mode === 'forgot'
                    ? 'Enter your email to receive a password reset link.'
                    : mode === 'signup'
                      ? 'Start tracking daily spending across your devices.'
                      : 'Sign in to open your synced expense notebook.'}
              </p>
            </div>

            {!recoveryMode && mode !== 'forgot' && (
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="mt-5 grid grid-cols-2 rounded-md border border-[#222A32] bg-[#0B0E11] p-0.5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signin'}
                  onClick={() => handleModeChange('signin')}
                  className={`py-2 text-xs font-medium rounded transition-colors ${
                    mode === 'signin'
                      ? 'bg-[#1A2129] text-[#34D399] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => handleModeChange('signup')}
                  className={`py-2 text-xs font-medium rounded transition-colors ${
                    mode === 'signup'
                      ? 'bg-[#1A2129] text-[#34D399] shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {!recoveryMode && mode === 'forgot' && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-[#F87171]/30 bg-[#7F1D1D]/25 px-3.5 py-2.5 text-xs font-medium text-[#FCA5A5]"
                >
                  {error}
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="rounded-md border border-[#34D399]/30 bg-[#064E3B]/30 px-3.5 py-2.5 text-xs font-medium text-[#6EE7B7]"
                >
                  {notice}
                </div>
              )}

              {unregisteredEmail && (
                <div
                  role="status"
                  className="rounded-md border border-[#FBBF24]/30 bg-[#78350F]/25 px-3.5 py-3 text-xs text-[#FDE68A] space-y-2"
                >
                  <p className="font-medium">
                    No account is registered with{' '}
                    <span className="font-mono-tabular">{unregisteredEmail}</span>.
                  </p>
                  <p>Would you like to create a new FinTracker account instead?</p>
                  <button
                    type="button"
                    onClick={() => switchToSignUpWithEmail(unregisteredEmail)}
                    className="inline-flex items-center rounded-md bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-[#042F21] hover:bg-[#34D399] transition-colors"
                  >
                    Create Account with This Email
                  </button>
                </div>
              )}

              {recoveryMode ? (
                <>
                  <div>
                    <label
                      htmlFor="recovery-new-password"
                      className="block text-xs font-medium text-[#94A3B8]"
                    >
                      New Password
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="recovery-new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="h-10 w-full rounded-md border border-[#222A32] bg-[#0B0E11] pl-3.5 pr-10 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="recovery-confirm-password"
                      className="block text-xs font-medium text-[#94A3B8]"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="recovery-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="h-10 w-full rounded-md border border-[#222A32] bg-[#0B0E11] pl-3.5 pr-10 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        aria-label={
                          showConfirmPassword ? 'Hide password' : 'Show password'
                        }
                        aria-pressed={showConfirmPassword}
                        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 w-full rounded-md bg-[#10B981] text-sm font-semibold text-[#042F21] hover:bg-[#34D399] disabled:opacity-60 transition-colors"
                  >
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </button>

                  {onCancelRecovery && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onCancelRecovery()}
                      className="w-full text-center text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                    >
                      Cancel and return to Sign In
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-xs font-medium text-[#94A3B8]"
                    >
                      Email Address
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (unregisteredEmail) {
                          setUnregisteredEmail(null);
                        }
                      }}
                      placeholder="you@example.com"
                      className="mt-1.5 h-10 w-full rounded-md border border-[#222A32] bg-[#0B0E11] px-3.5 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                    />
                  </div>

                  {mode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="auth-password"
                          className="block text-xs font-medium text-[#94A3B8]"
                        >
                          Password
                        </label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={openForgotPassword}
                            className="text-xs font-medium text-[#34D399] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] rounded"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative mt-1.5">
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete={
                            mode === 'signin' ? 'current-password' : 'new-password'
                          }
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="h-10 w-full rounded-md border border-[#222A32] bg-[#0B0E11] pl-3.5 pr-10 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div>
                      <label
                        htmlFor="auth-confirm-password"
                        className="block text-xs font-medium text-[#94A3B8]"
                      >
                        Confirm Password
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="h-10 w-full rounded-md border border-[#222A32] bg-[#0B0E11] pl-3.5 pr-10 text-sm text-[#F1F5F9] placeholder:text-[#7C8896] focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#34D399]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={
                            showConfirmPassword ? 'Hide password' : 'Show password'
                          }
                          aria-pressed={showConfirmPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#94A3B8] hover:bg-[#1A2129] hover:text-[#F1F5F9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 w-full rounded-md bg-[#10B981] text-sm font-semibold text-[#042F21] hover:bg-[#34D399] disabled:opacity-60 transition-colors"
                  >
                    {loading
                      ? 'Please wait...'
                      : mode === 'forgot'
                        ? 'Send Reset Link'
                        : mode === 'signin'
                          ? 'Sign In to Notebook'
                          : 'Create Account'}
                  </button>
                </>
              )}
            </form>

            <div className="mt-6 border-t border-[#222A32] pt-4 flex items-center gap-2 text-xs text-[#7C8896]">
              <Lock className="h-3.5 w-3.5 shrink-0 text-[#34D399]" aria-hidden="true" />
              <span>Private to your account · Export your records anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
