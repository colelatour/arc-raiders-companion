import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './AuthContext';
import { useAuth } from './AuthContext';
import { LoginPage } from './LoginPage';
import App from './App';
import { Loader } from 'lucide-react';

const AppWrapper = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-arc-900 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-arc-accent animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono">Loading ARC Terminal...</p>
        </div>
      </div>
    );
  }

  return user ? <App /> : <LoginPage />;
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>
);