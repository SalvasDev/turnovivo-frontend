'use client';

import { useEffect, useState } from 'react';

/** Clock seam: event handlers read the exact time here so tests can pin it. */
export const readNow = () => Date.now();

/** Current time that re-renders periodically, so slots that start while the page is open drop out. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(readNow);

  useEffect(() => {
    const timer = setInterval(() => setNow(readNow()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
