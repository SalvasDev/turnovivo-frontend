'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button as AriaButton, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { useAuth } from '@/context/AuthContext';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { Icon } from '@/design-system/atoms/Icon';
import { Avatar } from '@/design-system/atoms/Avatar';
import styles from './GlobalHeader.module.css';

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

export default function GlobalHeader() {
  const pathname = usePathname();
  
  const { user, logout, loading } = useAuth();
  const [darkTheme, setDarkTheme] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const canAccessAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const displayName = getDisplayName(user?.email);

  if (isAuthPage || (pathname !== '/' && (loading || !user))) {
    return null;
  }

  return (
    <header className={pathname === '/' ? `${styles.header} ${styles.homeHeader}` : styles.header} role="banner">
      <div className={styles.inner}>
        <Link href={pathname === '/' ? '/' : DEFAULT_DEMO_PATH} className={styles.brand} aria-label="Ir al inicio de TurnoVivo">
          TURNOVIVO
        </Link>

        <div className={styles.actions}>
          <a
            href={process.env.NEXT_PUBLIC_REPOSITORY_URL || 'https://github.com'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconButton}
            aria-label="GitHub"
            title="GitHub"
          >
            <Icon name="github" />
          </a>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={darkTheme ? 'Activar tema claro' : 'Activar tema oscuro'}
            title={darkTheme ? 'Activar tema claro' : 'Activar tema oscuro'}
            aria-pressed={darkTheme}
            onClick={() => {
              const nextTheme = !darkTheme;
              document.documentElement.dataset.theme = nextTheme ? 'dark' : 'light';
              setDarkTheme(nextTheme);
            }}
          >
            <Icon name="lightMode" />
          </button>
          {!loading && user && (
            <nav aria-label="Menu de usuario">
              <MenuTrigger>
                <AriaButton
                  className={styles.menuButton}
                  aria-label={`Menu de usuario de ${displayName}`}
                >
                  <span title={`Menu de usuario de ${displayName}`}>
                    <Avatar name={displayName} decorative />
                  </span>
                </AriaButton>
                <Popover placement="bottom end" offset={8} className={styles.popover}>
                  <div className={styles.identity}>
                    <p>{displayName}</p>
                    <p className={styles.role}>{user.role}</p>
                  </div>
                  <Menu aria-label="Opciones de sesion" className={styles.menu}>
                    {canAccessAdmin && (
                      <MenuItem href="/admin" className={styles.menuItem}>
                        Dashboard Admin
                      </MenuItem>
                    )}
                    <MenuItem onAction={logout} className={styles.menuItem}>
                      Cerrar sesion
                    </MenuItem>
                  </Menu>
                </Popover>
              </MenuTrigger>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}