import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { raider } from '../utils/api';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser } = useAuth();
  const [theme, setTheme] = useState<Theme>('dark'); // Start with default
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from user or localStorage
  useEffect(() => {
    if (user?.theme && !isInitialized) {
      setTheme(user.theme);
      setIsInitialized(true);
    } else if (!user && !isInitialized) {
      // User not logged in, use localStorage
      const saved = localStorage.getItem('arc_theme');
      setTheme((saved === 'light' || saved === 'dark') ? saved : 'dark');
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Update theme when user changes (login/logout)
  useEffect(() => {
    if (user?.theme && isInitialized) {
      setTheme(user.theme);
    }
  }, [user?.theme, isInitialized]);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('arc_theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Save to database if user is logged in
    if (user) {
      try {
        await raider.updateTheme(newTheme);
        // Update user context with new theme
        setUser({ ...user, theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        // Theme still changes locally even if save fails
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
