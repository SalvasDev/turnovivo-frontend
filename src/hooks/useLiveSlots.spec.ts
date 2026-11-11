import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppointmentSlot } from '@/types';
import { apiService } from '@/services/api';
import { useLiveSlots } from './useLiveSlots';

vi.mock('@/services/api', () => ({ apiService: { getAvailableSlots: vi.fn() } }));

const slot = (id: string): AppointmentSlot => ({
  id, businessId: 'biz', staffId: 'staff', status: 'AVAILABLE',
  startTime: '2026-11-13T10:00:00Z', endTime: '2026-11-13T10:30:00Z',
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('useLiveSlots', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('aborts the previous request and ignores its late response when reloading quickly', async () => {
    const first = deferred<AppointmentSlot[]>();
    const second = deferred<AppointmentSlot[]>();
    vi.mocked(apiService.getAvailableSlots)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useLiveSlots({ businessId: 'biz', initialSlots: [] }));

    let firstReload!: Promise<boolean>;
    let secondReload!: Promise<boolean>;
    act(() => { firstReload = result.current.reload(); });
    act(() => { secondReload = result.current.reload(); });
    const firstSignal = vi.mocked(apiService.getAvailableSlots).mock.calls[0][2];
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => { second.resolve([slot('fresh')]); });
    await act(async () => { first.resolve([slot('stale')]); });

    await expect(secondReload).resolves.toBe(true);
    await expect(firstReload).resolves.toBe(false);
    expect(result.current.slots.map(item => item.id)).toEqual(['fresh']);
  });

  it('drops a pending poll after invalidate so it cannot overwrite a newer local change', async () => {
    const pending = deferred<AppointmentSlot[]>();
    vi.mocked(apiService.getAvailableSlots).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useLiveSlots({ businessId: 'biz', initialSlots: [slot('local')] }));

    act(() => { void result.current.reload(); });
    act(() => { result.current.invalidate(); });
    await act(async () => { pending.resolve([slot('stale')]); });

    expect(result.current.slots.map(item => item.id)).toEqual(['local']);
    expect(result.current.isOffline).toBe(false);
  });

  it('aborts the pending request on unmount', async () => {
    vi.mocked(apiService.getAvailableSlots).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useLiveSlots({ businessId: 'biz', initialSlots: [], fetchOnMount: true }));
    await waitFor(() => expect(apiService.getAvailableSlots).toHaveBeenCalled());
    const signal = vi.mocked(apiService.getAvailableSlots).mock.calls[0][2];

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
