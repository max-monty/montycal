import { useState, useRef, useEffect } from 'react';
import { useViewStore } from '../../stores/view-store';
import { useUIStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import type { ViewMode } from '../../types';

const VIEW_OPTIONS: { mode: ViewMode; label: string }[] = [
  { mode: 'year', label: 'Year' },
  { mode: 'rolling12', label: 'Rolling 12' },
  { mode: 'infinite', label: 'Infinite' },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Extract Firebase error code like "auth/operation-not-allowed"
  const codeMatch = msg.match(/\(auth\/([\w-]+)\)/);
  const code = codeMatch?.[1];
  const map: Record<string, string> = {
    'operation-not-allowed': 'This sign-in method is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.',
    'user-not-found': 'No account found with this email.',
    'wrong-password': 'Incorrect password.',
    'invalid-credential': 'Invalid email or password.',
    'email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'weak-password': 'Password must be at least 6 characters.',
    'invalid-email': 'Invalid email address.',
    'too-many-requests': 'Too many attempts. Please try again later.',
    'popup-closed-by-user': '',
    'cancelled-popup-request': '',
    'network-request-failed': 'Network error. Check your internet connection.',
  };
  if (code && code in map) return map[code];
  return msg;
}

function AuthDropdown() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const googleBusy = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (googleBusy.current) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError('');
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleGoogle = async () => {
    setError('');
    googleBusy.current = true;
    try {
      await signInWithGoogle();
      setOpen(false);
    } catch (err) {
      console.error('Google sign-in error:', err);
      const friendly = friendlyAuthError(err);
      if (friendly) setError(friendly);
    } finally {
      googleBusy.current = false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      setOpen(false);
    } catch (err) {
      console.error('Email auth error:', err);
      setError(friendlyAuthError(err) || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs font-medium bg-cal-accent text-white rounded-lg hover:bg-cal-accent/80 transition-colors"
      >
        Sign in
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-cal-surface border border-cal-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold text-center">
              {mode === 'signup' ? 'Create your account' : 'Sign in to Monty Cal'}
            </p>

            {/* Google — always visible */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-cal-border" />
              <span className="text-xs text-cal-text-muted">or</span>
              <div className="flex-1 h-px bg-cal-border" />
            </div>

            {/* Email / password form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cal-accent"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cal-accent"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full px-3 py-2 text-sm font-medium bg-cal-accent text-white rounded-lg hover:bg-cal-accent/80 disabled:opacity-50 transition-colors"
              >
                {busy ? '...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-cal-text-muted text-center">
              {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}
                className="text-cal-accent hover:underline"
              >
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, signOut, sharedCalendars, activeCalendarUid, setActiveCalendar } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full overflow-hidden border-2 border-cal-border hover:border-cal-accent transition-colors"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full bg-cal-accent flex items-center justify-center text-white text-xs font-bold">
            {(user.displayName || user.email || '?')[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-cal-surface border border-cal-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-cal-border">
            <p className="text-sm font-semibold truncate">{user.displayName}</p>
            <p className="text-xs text-cal-text-muted truncate">{user.email}</p>
          </div>

          {/* Calendar switcher */}
          <div className="px-2 py-2 border-b border-cal-border">
            <button
              onClick={() => { setActiveCalendar(null); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                !activeCalendarUid
                  ? 'bg-cal-accent/10 text-cal-accent font-medium'
                  : 'text-cal-text hover:bg-cal-surface-hover'
              }`}
            >
              My Calendar
            </button>
            {sharedCalendars.map((cal) => (
              <button
                key={cal.shareId}
                onClick={() => { setActiveCalendar(cal.ownerUid, cal.ownerName || cal.ownerEmail); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeCalendarUid === cal.ownerUid
                    ? 'bg-cal-accent/10 text-cal-accent font-medium'
                    : 'text-cal-text hover:bg-cal-surface-hover'
                }`}
              >
                {cal.ownerName || cal.ownerEmail}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div className="px-2 py-2">
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { focusYear, viewMode, setViewMode, zoomValue, setZoomValue, nextYear, prevYear } = useViewStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const { user, loading, activeCalendarName } = useAuthStore();

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-cal-surface border-b border-cal-border shrink-0">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="w-8 h-8 flex flex-col items-center justify-center gap-1 rounded-lg hover:bg-cal-surface-hover transition-colors"
      >
        <span className="w-4 h-0.5 bg-cal-text-muted rounded" />
        <span className="w-4 h-0.5 bg-cal-text-muted rounded" />
        <span className="w-4 h-0.5 bg-cal-text-muted rounded" />
      </button>

      {/* Title */}
      <h1 className="text-lg font-bold tracking-tight">
        <span className="text-cal-accent">Monty</span> Cal
      </h1>

      {/* Active calendar indicator */}
      {activeCalendarName && (
        <span className="hidden sm:inline text-xs bg-cal-accent/15 text-cal-accent px-2 py-0.5 rounded-full font-medium">
          {activeCalendarName}'s calendar
        </span>
      )}

      {/* Year nav (year mode only) */}
      {viewMode === 'year' && (
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={prevYear}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted text-sm"
          >
            ‹
          </button>
          <span className="text-sm font-semibold min-w-[4ch] text-center">{focusYear}</span>
          <button
            onClick={nextYear}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted text-sm"
          >
            ›
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* View mode toggle */}
      <div className="hidden sm:flex items-center bg-cal-bg rounded-lg p-0.5">
        {VIEW_OPTIONS.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === mode
                ? 'bg-cal-accent text-white'
                : 'text-cal-text-muted hover:text-cal-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoomValue(zoomValue - 0.1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted text-lg leading-none"
        >
          −
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={zoomValue}
          onChange={(e) => setZoomValue(parseFloat(e.target.value))}
          className="w-20 sm:w-32 accent-cal-accent h-1"
        />
        <button
          onClick={() => setZoomValue(zoomValue + 0.1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted transition-colors"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Today button */}
      <button
        onClick={() => {
          const { setSelectedDate, setFocusYear } = useViewStore.getState();
          const today = new Date();
          setFocusYear(today.getFullYear());
          setSelectedDate(today.toISOString().split('T')[0]);
        }}
        className="hidden sm:block px-3 py-1 text-xs font-medium bg-cal-today/20 text-cal-today rounded-lg hover:bg-cal-today/30 transition-colors"
      >
        Today
      </button>

      {/* Auth section */}
      {!loading && !user && <AuthDropdown />}
      {!loading && user && <UserMenu />}
    </header>
  );
}
