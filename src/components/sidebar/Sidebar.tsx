import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/ui-store';
import { useCalendarStore } from '../../stores/calendar-store';
import { CategoryManager } from './CategoryManager';
import { useRef } from 'react';

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const exportData = useCalendarStore((s) => s.exportData);
  const importData = useCalendarStore((s) => s.importData);
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
              <CategoryManager />

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
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
