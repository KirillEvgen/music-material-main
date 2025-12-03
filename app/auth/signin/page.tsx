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
      
      // Логируем ответ для отладки
      console.log('Ответ от API login:', response);
      
      // Проверяем различные возможные поля для токена
      let token = response.access || (response as any).token || (response as any).access_token;
      
      // Если токен не найден, возможно API использует сессионную авторизацию
      // В этом случае используем специальный маркер для сессионной авторизации
      if (!token || (typeof token === 'string' && token.trim() === '')) {
        console.warn('Токен не найден в ответе. API может использовать сессионную авторизацию через cookies.');
        console.log('Структура ответа:', JSON.stringify(response, null, 2));
        
        // Используем специальный маркер для сессионной авторизации
        // В запросах будем полагаться на cookies
        token = 'SESSION_AUTH'; // Специальный маркер
        console.log('Используем сессионную авторизацию через cookies');
      } else {
        console.log('Токен получен, длина:', token.length);
      }
      
      dispatch(
        setCredentials({
          user: {
            id: (response as any).id || 0,
            username: response.username || (response as any).user?.username || email.split('@')[0],
            email: response.email || (response as any).user?.email || email,
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
      
      // Проверяем, есть ли сохраненный путь для редиректа
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        console.log('Редирект на:', redirectPath);
        router.push(redirectPath);
      } else {
        router.push('/');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Показываем более понятное сообщение для разных типов ошибок
        if (err.status === 401) {
          setError('Неверный email или пароль. Проверьте правильность введенных данных.');
        } else if (err.status === 400) {
          setError('Проверьте правильность введенных данных.');
        } else if (err.status >= 500) {
          setError('Сервер временно недоступен. Попробуйте позже.');
        } else {
          setError(err.message || 'Произошла ошибка при входе. Попробуйте еще раз.');
        }
      } else {
        setError('Произошла ошибка при входе. Проверьте подключение к интернету.');
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
