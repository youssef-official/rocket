import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// OAuth callbacks are no longer used - redirect to settings
export const VercelOAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Token-based auth is now used instead of OAuth
    navigate('/settings', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to settings...</p>
    </div>
  );
};
