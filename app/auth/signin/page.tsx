'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './signin.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch } from '../../../src/store/hooks';
import { setCredentials } from '../../../src/store/authSlice';
import { login, ApiError } from '../../../src/api/api';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      dispatch(
        setCredentials({
          user: {
            id: 0, // API не возвращает id, используем 0
            username: response.username,
            email: response.email,
          },
          token: response.access,
        })
      );
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при входе. Попробуйте еще раз.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.containerEnter}>
          <div className={styles.modal__block}>
            <form className={styles.modal__form} onSubmit={handleSubmit}>
              <Link href="/">
                <div className={styles.modal__logo}>
                  <Image
                    src="/img/logo_modal.png"
                    alt="logo"
                    width={113}
                    height={17}
                  />
                </div>
              </Link>
              <input
                className={classNames(styles.modal__input, styles.login)}
                type="text"
                name="login"
                placeholder="Почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className={classNames(styles.modal__input)}
                type="password"
                name="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className={styles.errorContainer}>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              </div>
              <button 
                className={styles.modal__btnEnter} 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
              <Link href="/auth/signup" className={styles.modal__btnSignup}>
                Зарегистрироваться
              </Link>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
