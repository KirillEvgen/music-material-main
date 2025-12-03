'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/authSlice';

interface HeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export default function Header({ isMenuOpen, onMenuToggle }: HeaderProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/auth/signin');
  };

  return (
    <nav className={styles.main__nav}>
      <div className={styles.nav__logo}>
        <Image
          width={250}
          height={170}
          className={styles.logo__image}
          src="/img/logo.png"
          alt="logo"
        />
      </div>
      <div className={styles.nav__burger} onClick={onMenuToggle}>
        <span className={styles.burger__line}></span>
        <span className={styles.burger__line}></span>
        <span className={styles.burger__line}></span>
      </div>
      <div
        className={`${styles.nav__menu} ${isMenuOpen ? styles.nav__menu_open : ''}`}
      >
        <ul className={styles.menu__list}>
          <li className={styles.menu__item}>
            <Link href="/" className={styles.menu__link}>
              Главное
            </Link>
          </li>
          <li className={styles.menu__item}>
            <Link href="/playlist" className={styles.menu__link}>
              Мой плейлист
            </Link>
          </li>
          {!mounted ? (
            <li className={styles.menu__item}>
              <Link href="/auth/signin" className={styles.menu__link}>
                Войти
              </Link>
            </li>
          ) : isAuthenticated ? (
            <>
              {user && (
                <li className={styles.menu__item}>
                  <span className={styles.menu__link} style={{ cursor: 'default' }}>
                    {user.username}
                  </span>
                </li>
              )}
              <li className={styles.menu__item}>
                <button
                  onClick={handleLogout}
                  className={styles.menu__link}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit',
                    padding: 0,
                  }}
                >
                  Выйти
                </button>
              </li>
            </>
          ) : (
            <li className={styles.menu__item}>
              <Link href="/auth/signin" className={styles.menu__link}>
                Войти
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
