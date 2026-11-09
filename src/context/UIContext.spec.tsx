import { useRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UIProvider, useUI } from './UIContext';

function Harness() {
  const ui = useUI();
  const [confirmed, setConfirmed] = useState<string>('pending');
  const stopRef = useRef<(() => void) | null>(null);

  return (
    <div>
      <button onClick={() => ui.success('Operacion exitosa')}>toast-success</button>
      <button
        onClick={async () => {
          const ok = await ui.confirm({ description: 'Seguro?' });
          setConfirmed(ok ? 'yes' : 'no');
        }}
      >
        open-confirm
      </button>
      <button
        onClick={() => {
          stopRef.current = ui.loading('Guardando cambios');
        }}
      >
        start-loading
      </button>
      <button onClick={() => stopRef.current?.()}>stop-loading</button>
      <span data-testid="confirm-state">{confirmed}</span>
    </div>
  );
}

describe('UIContext', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('muestra toast success y lo cierra por tiempo', async () => {
    vi.useFakeTimers();

    render(
      <UIProvider>
        <Harness />
      </UIProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toast-success' }));
    expect(screen.getByText('Operacion exitosa')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(screen.queryByText('Operacion exitosa')).not.toBeInTheDocument();
  });

  it('resuelve confirm en true al aceptar', async () => {
    vi.useRealTimers();

    render(
      <UIProvider>
        <Harness />
      </UIProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'open-confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-state')).toHaveTextContent('yes');
    });
  });

  it('mantiene loading hasta cerrarlo manualmente', async () => {
    vi.useFakeTimers();

    render(
      <UIProvider>
        <Harness />
      </UIProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'start-loading' }));
    expect(screen.getByText('Procesando: Guardando cambios')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText('Procesando: Guardando cambios')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'stop-loading' }));
    expect(screen.queryByText('Procesando: Guardando cambios')).not.toBeInTheDocument();
  });
});
