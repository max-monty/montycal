import { useCallback, useRef, useEffect, useState } from 'react';
import { useViewStore } from '../stores/view-store';

// Grid content width = label-w (60px) + 31 * cell-w (80px) = 2540px
const GRID_CONTENT_WIDTH = 60 + 31 * 80;

export function useZoom(containerRef: React.RefObject<HTMLDivElement | null>) {
  const { zoomValue, setZoomValue } = useViewStore();
  const isPinching = useRef(false);
  const lastPinchDistance = useRef(0);
  const [fitScale, setFitScale] = useState<number | null>(null);

  // Calculate the scale that fits grid width to container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const calcFit = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth > 0) {
        setFitScale(containerWidth / GRID_CONTENT_WIDTH);
      }
    };

    calcFit();
    const observer = new ResizeObserver(calcFit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  // Set initial zoom to fit-to-width on first measurement
  const initializedRef = useRef(false);
  useEffect(() => {
    if (fitScale !== null && !initializedRef.current) {
      initializedRef.current = true;
      // zoomValue 0 = fitScale, zoomValue 1 = fitScale * 4
      // So we start at 0
      setZoomValue(0);
    }
  }, [fitScale, setZoomValue]);

  // Scale: zoomValue 0 = fit-to-width, zoomValue 1 = 4x that
  const baseScale = fitScale ?? (window.innerWidth / GRID_CONTENT_WIDTH);
  const maxScale = baseScale * 4;
  const scale = baseScale + zoomValue * (maxScale - baseScale);

  // Desktop: Ctrl+scroll wheel
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const delta = -e.deltaY * 0.002;
      const currentZoom = useViewStore.getState().zoomValue;
      setZoomValue(currentZoom + delta);
    },
    [setZoomValue]
  );

  // Mobile: pinch-to-zoom
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPinching.current || e.touches.length !== 2) return;
      e.preventDefault();

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const delta = (distance - lastPinchDistance.current) * 0.003;
      lastPinchDistance.current = distance;

      const currentZoom = useViewStore.getState().zoomValue;
      setZoomValue(currentZoom + delta);
    },
    [setZoomValue]
  );

  const handleTouchEnd = useCallback(() => {
    isPinching.current = false;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { scale, zoomValue };
}
