import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (email, password) => {
    const users = {
      'admin@gmail.com': { role: 'admin', password: 'admin1234' },
      'customer@gmail.com': { role: 'customer', password: 'customer1234' }
    };

    const userData = users[email];
    if (userData && userData.password === password) {
      const user = { email, role: userData.role };
      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, role: userData.role };
    }
    return { success: false };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Router Component
const Router = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  return React.Children.map(children, child =>
    React.cloneElement(child, { currentPath, navigate })
  );
};

const Route = ({ path, component: Component, currentPath, navigate }) => {
  return currentPath === path ? <Component navigate={navigate} /> : null;
};

const ProtectedRoute = ({ path, component: Component, currentPath, navigate, allowedRole }) => {
  const { user } = useAuth();

  if (currentPath !== path) return null;

  if (!user) {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  if (allowedRole && user.role !== allowedRole) {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  return <Component navigate={navigate} />;
};

