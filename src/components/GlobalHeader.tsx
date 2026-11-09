'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_DEMO_PATH } from '@/config/app';

const USER_MENU_ID = 'global-user-menu';

function getDisplayName(email?: string) {
  if (!email) return 'Invitado';
  const local = email.split('@')[0] ?? '';
  const normalized = local.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return 'Usuario';
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getInitial(name?: string) {
  if (!name) return 'U';
  return name.trim().charAt(0).toUpperCase() || 'U';
}

export default function GlobalHeader() {
  const pathname = usePathname();
  
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const canAccessAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const displayName = getDisplayName(user?.email);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
  }, [open]);

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      menuButtonRef.current?.focus();
    }
  };

  if (isAuthPage || loading || !user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur" role="banner">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={DEFAULT_DEMO_PATH} className="flex items-center gap-2" aria-label="Ir al inicio de TurnoVivo">
          <span className="text-xl font-black tracking-tighter text-emerald-500">TurnoVivo</span>
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">LIVE</span>
        </Link>

        <nav className="relative" ref={menuRef} aria-label="Menu de usuario">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-1.5 hover:border-zinc-700"
              aria-expanded={open}
              aria-haspopup="menu"
              aria-controls={USER_MENU_ID}
              aria-label={`Menu de usuario de ${displayName}`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-400">
                {getInitial(displayName)}
              </div>
              <div className="leading-tight text-left">
                <p className="text-xs font-semibold text-zinc-200">{displayName}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {user ? user.role : 'Sin sesion'}
                </p>
              </div>
              <span className="text-zinc-500">▾</span>
            </button>

            {open && (
              <div
                id={USER_MENU_ID}
                role="menu"
                aria-label="Opciones de sesion"
                onKeyDown={handleMenuKeyDown}
                className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl"
              >
                {canAccessAdmin && (
                  <Link
                    role="menuitem"
                    href="/admin"
                    onClick={() => setOpen(false)}
                    tabIndex={0}
                    className="block rounded-lg px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10"
                  >
                    Dashboard Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-500/10"
                >
                  Cerrar sesion
                </button>
              </div>
            )}
          </nav>
      </div>
    </header>
  );
}