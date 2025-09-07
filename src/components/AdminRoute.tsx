import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  const isAdmin = Boolean(user && (user as any).isAdmin) || user?.username?.toLowerCase() === 'admin' || (user as any)?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/admin-login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/admin-login" state={{ from: location, reason: 'not_admin' }} replace />;

  return <>{children}</>;
};


