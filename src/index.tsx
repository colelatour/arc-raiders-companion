import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import App from './App';
import { Loader } from 'lucide-react';
import '../index.css';

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

  return (
    <Routes>
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={user ? <App /> : <Navigate to="/login" replace />} />
    </Routes>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppWrapper />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);