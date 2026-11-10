import { useRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UIProvider, useUI } from './UIContext';

function Harness() {
  const ui = useUI();
  const [confirmed, setConfirmed] = useState<string>('pending');
  const stopRef = useRef<(() => void) | null>(null);

  return (
    <div>
      <button onClick={() => ui.success('Operacion exitosa')}>toast-success</button>
      <button onClick={() => ui.error('Operacion fallida')}>toast-error</button>
      <button onClick={() => ui.info('Informacion')}>toast-info</button>
      <button onClick={() => ui.warning('Advertencia')}>toast-warning</button>
      <button
        onClick={async () => {
          const ok = await ui.confirm({ description: 'Seguro?' });
          setConfirmed(ok ? 'yes' : 'no');
        }}
      >
        open-confirm
      </button>
      <button
        onClick={async () => {
          const ok = await ui.confirm({
            title: 'Cancelar cita', description: 'Seguro?', tone: 'danger',
            confirmText: 'Si, cancelar', cancelText: 'Volver',
          });
          setConfirmed(ok ? 'yes' : 'no');
        }}
      >
        open-danger-confirm
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

  it.each(['cancel', 'escape'])('resuelve confirm en false al cerrar con %s y restaura el foco', async (method) => {
    const user = userEvent.setup();
    render(<UIProvider><Harness /></UIProvider>);
    const trigger = screen.getByRole('button', { name: 'open-confirm' });
    await user.click(trigger);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    if (method === 'cancel') {
      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    } else {
      await user.keyboard('{Escape}');
    }
    await waitFor(() => expect(screen.getByTestId('confirm-state')).toHaveTextContent('no'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('mantiene tone danger y etiquetas existentes al usar el nuevo dialogo', async () => {
    const user = userEvent.setup();
    render(<UIProvider><Harness /></UIProvider>);
    await user.click(screen.getByRole('button', { name: 'open-danger-confirm' }));
    expect(screen.getByRole('alertdialog', { name: 'Cancelar cita' })).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Si, cancelar' }));
    await waitFor(() => expect(screen.getByTestId('confirm-state')).toHaveTextContent('yes'));
  });

  it.each([
    ['toast-success', 'Operacion exitosa', 2400],
    ['toast-error', 'Operacion fallida', 4200],
    ['toast-info', 'Informacion', 3000],
    ['toast-warning', 'Advertencia', 3600],
  ] as const)('conserva la duracion de %s', (trigger, message, duration) => {
    vi.useFakeTimers();
    render(<UIProvider><Harness /></UIProvider>);
    fireEvent.click(screen.getByRole('button', { name: trigger }));
    act(() => { vi.advanceTimersByTime(duration - 1); });
    expect(screen.getByText(message)).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });

  it('cierra solo el toast seleccionado sin duplicar regiones live', async () => {
    const user = userEvent.setup();
    render(<UIProvider><Harness /></UIProvider>);
    await user.click(screen.getByRole('button', { name: 'toast-success' }));
    await user.click(screen.getByRole('button', { name: 'toast-error' }));
    const region = screen.getByRole('region', { name: 'Notificaciones' });
    expect(region).not.toHaveAttribute('aria-live');
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'success');
    const error = screen.getByRole('alert');
    expect(error).toHaveAttribute('data-variant', 'error');
    await user.click(within(error).getByRole('button', { name: 'Cerrar notificacion' }));
    expect(screen.queryByText('Operacion fallida')).not.toBeInTheDocument();
    expect(screen.getByText('Operacion exitosa')).toBeInTheDocument();
  });

  it('permite cerrar loading y llamar despues a su funcion de limpieza', async () => {
    const user = userEvent.setup();
    render(<UIProvider><Harness /></UIProvider>);
    await user.click(screen.getByRole('button', { name: 'start-loading' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar notificacion' }));
    expect(screen.queryByText('Procesando: Guardando cambios')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'stop-loading' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
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
