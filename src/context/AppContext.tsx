import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Merchant, MerchantProfile, Notification } from '../types';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  token: string | null;
  merchantCode: string | null;
  merchantId: string | null;
  merchantStatus: string | null;
  toast: ToastState | null;
  activeTab: string;
  adminTab: string;
  notifications: Notification[];
  profile: MerchantProfile | null;
  isLoading: boolean;
  setPage: (page: string) => void;
  setActiveTab: (tab: string) => void;
  setAdminTab: (tab: string) => void;
  login: (token: string, user: User, merchantCode: string) => void;
  logout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: () => void;
  refreshMe: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<any>;
  currentPath: string;
  navigateTo: (path: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('payhub_token'));
  const [merchantCode, setMerchantCode] = useState<string | null>(localStorage.getItem('payhub_merchant_code'));
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantStatus, setMerchantStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom SPA Router state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Synchronize path and routing
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Show Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const dismissToast = () => {
    setToast(null);
  };

  // Auto dismiss toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Request abstraction attaching the token
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      // Auto logout if unauthenticated
      logout();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${res.status}`);
    }

    return res.json();
  };

  // Refresh user data & active profile
  const refreshMe = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchWithAuth('/api/auth/me');
      setUser(data.user);
      setMerchantCode(data.merchantCode);
      setMerchantId(data.merchantId);
      setMerchantStatus(data.merchantStatus);
      
      if (data.merchantCode) {
        localStorage.setItem('payhub_merchant_code', data.merchantCode);
      }

      // If user is merchant or staff, load profile details
      if (data.user && (data.user.role === 'merchant' || data.user.role === 'staff')) {
        try {
          const profData = await fetchWithAuth('/api/merchant/profile');
          setProfile(profData.profile);
        } catch (err) {
          console.error('Failed to load merchant profile details', err);
        }

        // Fetch notifications
        try {
          const notifData = await fetchWithAuth('/api/merchant/notifications');
          setNotifications(notifData.notifications);
        } catch (err) {
          console.error('Failed to load notifications', err);
        }
      }
    } catch (err) {
      console.error('Failed to restore session credentials', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, [token]);

  const login = (newToken: string, newUser: User, code: string) => {
    localStorage.setItem('payhub_token', newToken);
    if (code) localStorage.setItem('payhub_merchant_code', code);
    setToken(newToken);
    setUser(newUser);
    setMerchantCode(code);
    showToast(`Welcome back, ${newUser.firstName}!`, 'success');
    
    if (newUser.role === 'admin') {
      navigateTo('/admin');
    } else {
      navigateTo('/dashboard');
    }
  };

  const logout = () => {
    localStorage.removeItem('payhub_token');
    localStorage.removeItem('payhub_merchant_code');
    setToken(null);
    setUser(null);
    setMerchantCode(null);
    setMerchantId(null);
    setMerchantStatus(null);
    setProfile(null);
    setNotifications([]);
    showToast('Signed out of PayHub', 'info');
    navigateTo('/login');
  };

  const setPage = (pageName: string) => {
    navigateTo(pageName);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        merchantCode,
        merchantId,
        merchantStatus,
        toast,
        activeTab,
        adminTab,
        notifications,
        profile,
        isLoading,
        setPage,
        setActiveTab,
        setAdminTab,
        login,
        logout,
        showToast,
        dismissToast,
        refreshMe,
        fetchWithAuth,
        currentPath,
        navigateTo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
