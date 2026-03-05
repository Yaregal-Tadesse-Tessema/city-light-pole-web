import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation('protectedRoute');

  if (loading) {
    return <div>{t('loading')}</div>;
  }

  if (!user) {
    // Save the intended destination before redirecting to login
    const redirectPath = location.pathname + location.search;
    localStorage.setItem('redirectAfterLogin', redirectPath);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}


