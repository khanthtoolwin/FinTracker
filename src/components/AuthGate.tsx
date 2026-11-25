import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
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
        const { data, error: rpcError } = await supabase.rpc(
          'check_email_registered',
          { email_input: trimmedEmail }
        );

        if (rpcError) {
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
            'Too many reset checks for this email. Please wait 15 minutes before trying again.'
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
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-[#E7E5E0] bg-white rounded-lg p-7 sm:p-8">
        <div className="border-b border-[#E7E5E0] pb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#18181B]">
            FinTracker
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">
            {recoveryMode
              ? 'Choose a new password for your FinTracker account.'
              : mode === 'forgot'
                ? 'Verify your email to receive a password reset link.'
                : 'Sign in to open your synced expense notebook.'}
          </p>
        </div>

        {!recoveryMode && mode !== 'forgot' && (
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mt-5 grid grid-cols-2 rounded-md border border-[#E7E5E0] bg-[#FAF9F6] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => handleModeChange('signin')}
              className={`py-2 text-xs font-medium rounded transition-colors ${
                mode === 'signin'
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
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
                  ? 'bg-white text-[#18181B] shadow-xs'
                  : 'text-[#57534E] hover:text-[#18181B]'
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
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#18181B] transition-colors"
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
              className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-medium text-[#DC2626]"
            >
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2.5 text-xs font-medium text-[#166534]"
            >
              {notice}
            </div>
          )}

          {unregisteredEmail && (
            <div
              role="status"
              className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-3 text-xs text-[#92400E] space-y-2"
            >
              <p className="font-medium">
                No account is registered with{' '}
                <span className="font-mono-tabular">{unregisteredEmail}</span>.
              </p>
              <p>Would you like to create a new FinTracker account instead?</p>
              <button
                type="button"
                onClick={() => switchToSignUpWithEmail(unregisteredEmail)}
                className="inline-flex items-center rounded-md bg-[#166534] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#14532D] transition-colors"
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
                  className="block text-xs font-medium text-[#57534E]"
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
                    className="h-10 w-full rounded-md border border-[#E7E5E0] bg-white pl-3.5 pr-10 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#57534E] hover:bg-[#F4F2ED] hover:text-[#18181B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
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
                  className="block text-xs font-medium text-[#57534E]"
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
                    className="h-10 w-full rounded-md border border-[#E7E5E0] bg-white pl-3.5 pr-10 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showConfirmPassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#57534E] hover:bg-[#F4F2ED] hover:text-[#18181B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
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
                className="h-10 w-full rounded-md bg-[#166534] text-sm font-medium text-white hover:bg-[#14532D] disabled:opacity-60 transition-colors"
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>

              {onCancelRecovery && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onCancelRecovery()}
                  className="w-full text-center text-xs font-medium text-[#57534E] hover:text-[#18181B] transition-colors"
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
                  className="block text-xs font-medium text-[#57534E]"
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
                  className="mt-1.5 h-10 w-full rounded-md border border-[#E7E5E0] bg-white px-3.5 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                />
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-medium text-[#57534E]"
                    >
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs font-medium text-[#166534] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] rounded"
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
                      className="h-10 w-full rounded-md border border-[#E7E5E0] bg-white pl-3.5 pr-10 text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[#57534E] hover:bg-[#F4F2ED] hover:text-[#18181B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
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

              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-md bg-[#166534] text-sm font-medium text-white hover:bg-[#14532D] disabled:opacity-60 transition-colors"
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
      </div>
    </div>
  );
}
