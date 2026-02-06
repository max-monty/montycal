import { useViewStore } from '../../stores/view-store';
import { useUIStore } from '../../stores/ui-store';
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

export function Header() {
  const { focusYear, viewMode, setViewMode, zoomValue, setZoomValue, nextYear, prevYear } = useViewStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

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
    </header>
  );
}
