import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/ui-store';
import { useCalendarStore } from '../../stores/calendar-store';
import { useAuthStore } from '../../stores/auth-store';
import { CategoryManager } from './CategoryManager';
import { useRef, useState } from 'react';

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

function SharingSection() {
  const { user, sharedCalendars, setActiveCalendar, loadSharedCalendars } = useAuthStore();
  const [shareEmail, setShareEmail] = useState('');
  const [myShares, setMyShares] = useState<{ id: string; collaboratorEmail: string }[]>([]);
  const [sharesLoaded, setSharesLoaded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const loadMyShares = async () => {
    try {
      const { FirebaseRepository } = await import('../../data/firebase-repository');
      const repo = new FirebaseRepository();
      const shares = await repo.getMyShares();
      setMyShares(shares.map((s) => ({ id: s.id, collaboratorEmail: s.collaboratorEmail })));
      setSharesLoaded(true);
    } catch {
      setSharesLoaded(true);
    }
  };

  if (!sharesLoaded) {
    loadMyShares();
  }

  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    setError('');
    setSharing(true);
    try {
      const { FirebaseRepository } = await import('../../data/firebase-repository');
      const repo = new FirebaseRepository();
      await repo.shareCalendar(shareEmail.trim());
      setShareEmail('');
      setSharesLoaded(false); // trigger reload
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { FirebaseRepository } = await import('../../data/firebase-repository');
      const repo = new FirebaseRepository();
      await repo.removeShare(shareId);
      setSharesLoaded(false);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-cal-text-muted uppercase tracking-wider">Sharing</h3>

      {/* Share with someone */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleShare()}
            placeholder="Email to share with..."
            className="flex-1 bg-cal-bg border border-cal-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cal-accent"
          />
          <button
            onClick={handleShare}
            disabled={sharing || !shareEmail.trim()}
            className="px-3 py-1.5 text-xs font-medium bg-cal-accent text-white rounded-lg hover:bg-cal-accent/80 disabled:opacity-50 transition-colors"
          >
            Share
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* People I've shared with */}
      {myShares.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-cal-text-muted">Shared with:</p>
          {myShares.map((share) => (
            <div key={share.id} className="flex items-center justify-between gap-2 py-1">
              <span className="text-xs truncate">{share.collaboratorEmail}</span>
              <button
                onClick={() => handleRemoveShare(share.id)}
                className="text-xs text-red-400 hover:text-red-300 shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Calendars shared with me */}
      {sharedCalendars.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-cal-text-muted">Shared with me:</p>
          {sharedCalendars.map((cal) => (
            <button
              key={cal.shareId}
              onClick={() => setActiveCalendar(cal.ownerUid, cal.ownerName || cal.ownerEmail)}
              className="w-full text-left text-xs py-1.5 px-2 rounded-lg hover:bg-cal-surface-hover transition-colors"
            >
              {cal.ownerName || cal.ownerEmail}
            </button>
          ))}
          <button
            onClick={() => loadSharedCalendars()}
            className="text-xs text-cal-accent hover:underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const exportData = useCalendarStore((s) => s.exportData);
  const importData = useCalendarStore((s) => s.importData);
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `montycal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importData(text);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-30 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-cal-surface z-30 border-r border-cal-border shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cal-border">
              <h2 className="text-sm font-bold tracking-wider uppercase text-cal-text-muted">Settings</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cal-surface-hover text-cal-text-muted"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-cal-surface-hover text-cal-text-muted hover:text-cal-text transition-colors text-sm"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>

              <CategoryManager />

              {/* Sharing (only when signed in) */}
              {user && <SharingSection />}

              {/* Data Management */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-cal-text-muted uppercase tracking-wider">Data</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex-1 border border-cal-border text-cal-text-muted text-xs py-2 rounded-lg hover:bg-cal-surface-hover transition-colors"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border border-cal-border text-cal-text-muted text-xs py-2 rounded-lg hover:bg-cal-surface-hover transition-colors"
                  >
                    Import JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Demo mode indicator */}
              {!user && (
                <div className="text-xs text-cal-text-muted bg-cal-bg rounded-lg p-3">
                  <p className="font-medium mb-1">Demo Mode</p>
                  <p>Data is stored locally in your browser. Sign in with Google to save to the cloud and share.</p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
