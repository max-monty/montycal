import { useState, useCallback, useRef, useEffect } from 'react';

interface MonthEntry {
  year: number;
  month: number; // 0-indexed
}

export function useInfiniteScroll(_initialYear: number) {
  const [months, setMonths] = useState<MonthEntry[]>(() => {
    const now = new Date();
    const entries: MonthEntry[] = [];
    // Start 12 months back, show 36 months ahead
    for (let i = -12; i <= 36; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      entries.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return entries;
  });

  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  const loadMoreTop = useCallback(() => {
    setMonths((prev) => {
      const first = prev[0];
      const newMonths: MonthEntry[] = [];
      for (let i = 12; i >= 1; i--) {
        const d = new Date(first.year, first.month - i, 1);
        newMonths.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return [...newMonths, ...prev];
    });
  }, []);

  const loadMoreBottom = useCallback(() => {
    setMonths((prev) => {
      const last = prev[prev.length - 1];
      const newMonths: MonthEntry[] = [];
      for (let i = 1; i <= 12; i++) {
        const d = new Date(last.year, last.month + i, 1);
        newMonths.push({ year: d.getFullYear(), month: d.getMonth() });
      }
      return [...prev, ...newMonths];
    });
  }, []);

  useEffect(() => {
    const topEl = topSentinelRef.current;
    const bottomEl = bottomSentinelRef.current;
    if (!topEl || !bottomEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (entry.target === topEl) loadMoreTop();
          if (entry.target === bottomEl) loadMoreBottom();
        }
      },
      { rootMargin: '800px' }
    );

    observer.observe(topEl);
    observer.observe(bottomEl);

    return () => observer.disconnect();
  }, [loadMoreTop, loadMoreBottom]);

  return {
    months,
    topSentinelRef,
    bottomSentinelRef,
    loadMoreTop,
    loadMoreBottom,
  };
}
