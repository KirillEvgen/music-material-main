'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './signup.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch } from '../../../src/store/hooks';
import { setCredentials } from '../../../src/store/authSlice';
import { signup, ApiError } from '../../../src/api/api';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== repeatPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      // Используем email как username для API
      const username = email.split('@')[0] || email;
      const response = await signup({ email, password, username });
      
      // Логируем ответ для отладки
      console.log('Ответ от API signup:', response);
      
      // Проверяем, что токен получен
      const token = response.access || response.token || response.access_token;
      
      if (!token || (typeof token === 'string' && token.trim() === '')) {
        console.error('Токен не получен при регистрации. Ответ:', JSON.stringify(response, null, 2));
        setError('Ошибка: токен авторизации не был получен. Попробуйте войти после регистрации.');
        return;
      }
      
      console.log('Токен получен при регистрации, длина:', token.length);
      
      dispatch(
        setCredentials({
          user: {
            id: (response as any).id || (response as any)._id || 0,
            username: response.username || username,
            email: response.email || email,
          },
          token: token,
        })
      );
      
      // Ждем, пока токен сохранится в localStorage
      let attempts = 0;
      const maxAttempts = 20; // 20 попыток по 50мс = 1 секунда
      
      while (attempts < maxAttempts) {
        const savedToken = localStorage.getItem('token');
        if (savedToken && savedToken === token) {
          console.log('Токен успешно сохранен в localStorage');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      
      // Проверяем еще раз перед редиректом
      const finalToken = localStorage.getItem('token');
      if (!finalToken || finalToken !== token) {
        console.error('Токен не сохранился в localStorage. Ожидаемый:', token?.substring(0, 20), '... Полученный:', finalToken?.substring(0, 20));
        setError('Ошибка сохранения данных авторизации');
        return;
      }
      
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Произошла ошибка при регистрации. Попробуйте еще раз.');
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
                type="email"
                name="email"
                placeholder="Почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className={styles.modal__input}
                type="password"
                name="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <input
                className={styles.modal__input}
                type="password"
                name="repeatPassword"
                placeholder="Повторите пароль"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <div className={styles.errorContainer}>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              </div>
              <button 
                className={styles.modal__btnSignupEnt}
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
