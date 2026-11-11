'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button as AriaButton, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { useAuth } from '@/context/AuthContext';
import { setTheme, useTheme } from '@/context/theme';
import { DEFAULT_DEMO_PATH } from '@/config/app';
import { Icon } from '@/design-system/atoms/Icon';
import { Avatar } from '@/design-system/atoms/Avatar';
import { Spinner } from '@/design-system/atoms/Spinner';
import styles from './GlobalHeader.module.css';

const PUBLIC_PATHS = new Set(['/', '/design-system']);

function getDisplayName(email?: string) {
  if (!email) return 'Guest';
  const local = email.split('@')[0] ?? '';
  const normalized = local.replace(/[._-]+/g, ' ').trim();
  if (!normalized) return 'User';
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function GlobalHeader() {
  const pathname = usePathname();
  
  const { user, logout, loading } = useAuth();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const themeLabel = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const canAccessAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const displayName = getDisplayName(user?.email);

  if (!PUBLIC_PATHS.has(pathname) && (loading || !user)) {
    return null;
  }

  return (
    <header className={pathname === '/' ? `${styles.header} ${styles.homeHeader}` : styles.header} role="banner">
      <div className={styles.inner}>
        <Link href={pathname === '/' || !user ? '/' : DEFAULT_DEMO_PATH} className={styles.brand} aria-label="TurnoVivo home">
          TURNOVIVO
        </Link>

        <div className={styles.actions}>
          <a
            href={process.env.NEXT_PUBLIC_REPOSITORY_URL || 'https://github.com/SalvasDev'}
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
            aria-label={themeLabel}
            title={themeLabel}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            <Icon name={isDark ? 'lightMode' : 'darkMode'} />
          </button>
          {!loading && user && (
            <nav aria-label="User menu">
              <MenuTrigger>
                <AriaButton
                  className={styles.menuButton}
                  aria-label={isLoggingOut ? 'Signing out' : `User menu of ${displayName}`}
                  isDisabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <Spinner size="medium" />
                  ) : (
                    <span title={`User menu of ${displayName}`}>
                      <Avatar name={displayName} decorative />
                    </span>
                  )}
                </AriaButton>
                <Popover placement="bottom end" offset={8} className={styles.popover}>
                  <div className={styles.identity}>
                    <p>{displayName}</p>
                    <p className={styles.role}>{user.role}</p>
                  </div>
                  <Menu aria-label="Session options" className={styles.menu}>
                    {canAccessAdmin && (
                      <MenuItem href="/admin" className={styles.menuItem}>
                        Dashboard Admin
                      </MenuItem>
                    )}
                    <MenuItem
                      onAction={() => {
                        // The session is ending; keep the trigger locked until the page navigates away.
                        setIsLoggingOut(true);
                        void logout();
                      }}
                      className={styles.menuItem}
                    >
                      Log out
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