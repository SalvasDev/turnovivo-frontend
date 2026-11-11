'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppointmentSlot } from '@/types';
import { apiService } from '@/services/api';
import { isAbortError } from '@/services/http-client';

interface UseLiveSlotsOptions {
  businessId: string;
  initialSlots: AppointmentSlot[];
  authenticated?: boolean;
  fetchOnMount?: boolean;
  initialSyncing?: boolean;
  intervalMs?: number;
  /** Runs with every fresh list, after it is stored. */
  onSlots?: (slots: AppointmentSlot[]) => void;
}

/**
 * Keeps a business agenda in sync with the server. Only the newest request may update
 * the state: older ones are aborted, and late responses are ignored.
 */
export function useLiveSlots({
  businessId,
  initialSlots,
  authenticated = false,
  fetchOnMount = false,
  initialSyncing = false,
  intervalMs = 3000,
  onSlots,
}: UseLiveSlotsOptions) {
  const [slots, setSlots] = useState<AppointmentSlot[]>(initialSlots);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(initialSyncing);
  const onSlotsRef = useRef(onSlots);
  const controllerRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    onSlotsRef.current = onSlots;
  });

  /** Aborts the pending request and discards any response it may still deliver. */
  const invalidate = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    inFlightRef.current = null;
    latestRequestRef.current += 1;
  }, []);

  /** Starts a request that supersedes any pending one; resolves to true when its data was applied. */
  const reload = useCallback((): Promise<boolean> => {
    invalidate();
    const controller = new AbortController();
    const requestId = latestRequestRef.current;
    const isCurrent = () => requestId === latestRequestRef.current;
    controllerRef.current = controller;

    const request = (async () => {
      try {
        const freshSlots = await apiService.getAvailableSlots(
          businessId,
          authenticated ? { auth: true } : undefined,
          controller.signal,
        );
        if (!isCurrent()) return false;
        setIsOffline(false);
        setSlots(freshSlots);
        onSlotsRef.current?.(freshSlots);
        return true;
      } catch (err) {
        if (isCurrent() && !isAbortError(err)) setIsOffline(true);
        return false;
      } finally {
        if (isCurrent()) {
          setIsSyncing(false);
          controllerRef.current = null;
          inFlightRef.current = null;
        }
      }
    })();
    inFlightRef.current = request;
    return request;
  }, [businessId, authenticated, invalidate]);

  useEffect(() => {
    if (fetchOnMount) void reload();
    // Polling joins a pending request instead of cancelling it.
    const interval = setInterval(() => { void (inFlightRef.current ?? reload()); }, intervalMs);
    return () => {
      clearInterval(interval);
      invalidate();
    };
  }, [fetchOnMount, intervalMs, reload, invalidate]);

  return { slots, setSlots, isOffline, isSyncing, reload, invalidate };
}
