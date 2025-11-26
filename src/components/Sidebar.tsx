'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppSelector } from '../store/hooks';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);
  const [userName, setUserName] = useState('Гость');
  const [isMounted, setIsMounted] = useState(false);
  const [hasAuth, setHasAuth] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Проверяем авторизацию через localStorage напрямую
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      setHasAuth(!!(localToken && localUser));
      
      // Устанавливаем имя пользователя
      if (user?.username) {
        setUserName(user.username);
      } else if (localUser) {
        try {
          const parsedUser = JSON.parse(localUser);
          setUserName(parsedUser.username || parsedUser.email?.split('@')[0] || 'Гость');
        } catch (e) {
          setUserName('Гость');
        }
      } else {
        setUserName('Гость');
      }
    }
  }, [user]);

  return (
    <div className={styles.main__sidebar}>
      <div className={styles.sidebar__personal}>
        <p className={styles.sidebar__personalName} suppressHydrationWarning>
          {isMounted ? userName : 'Гость'}
        </p>
        <div className={styles.sidebar__icon}>
          <svg>
            <use xlinkHref="/img/icon/sprite.svg#logout"></use>
          </svg>
        </div>
      </div>
      {isMounted && (isAuthenticated || hasAuth) && (
        <div className={styles.sidebar__favorites}>
          <Link className={styles.sidebar__favoritesLink} href="/favorites">
            <svg className={styles.sidebar__favoritesIcon}>
              <use xlinkHref="/img/icon/sprite.svg#icon-like"></use>
            </svg>
            <span className={styles.sidebar__favoritesText}>Мои треки</span>
          </Link>
        </div>
      )}
      <div className={styles.sidebar__block}>
        <div className={styles.sidebar__list}>
          <div className={styles.sidebar__item}>
            <Link className={styles.sidebar__link} href="/playlist?id=1">
              <Image
                className={styles.sidebar__img}
                src="/img/playlist01.png"
                alt="day's playlist"
                width={250}
                height={170}
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>
          <div className={styles.sidebar__item}>
            <Link className={styles.sidebar__link} href="/playlist?id=2">
              <Image
                className={styles.sidebar__img}
                src="/img/playlist02.png"
                alt="day's playlist"
                width={250}
                height={170}
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>
          <div className={styles.sidebar__item}>
            <Link className={styles.sidebar__link} href="/playlist?id=3">
              <Image
                className={styles.sidebar__img}
                src="/img/playlist03.png"
                alt="day's playlist"
                width={250}
                height={170}
                style={{ width: 'auto', height: 'auto' }}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
