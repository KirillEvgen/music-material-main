'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAppDispatch } from '../store/hooks';
import { resetFilters } from '../store/musicSlice';

/**
 * Компонент для сброса фильтров при переходе между страницами
 */
export default function FilterReset() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Сбрасываем фильтры только при смене страницы, не при первом рендере
    if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
      dispatch(resetFilters());
    }
    prevPathRef.current = pathname;
  }, [pathname, dispatch]);

  return null;
}


