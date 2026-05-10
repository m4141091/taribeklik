import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface AdminGuardProps {
  children: React.ReactNode;
}

// NOTE: This component provides UX-level protection only.
// Actual security enforcement is via server-side RLS policies on all
// sensitive tables and verifyAdminAccess() in edge functions.
// Bypassing this guard does NOT grant access to admin-only data or operations.
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useIsAdmin(user?.id);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-lg">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">אין הרשאה</h1>
          <p className="text-muted-foreground">אין לך הרשאות גישה לפאנל הניהול</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
