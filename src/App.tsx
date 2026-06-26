/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import { AlertCircle } from 'lucide-react';

function AppContent() {
  const { currentPath, user, toast } = useApp();

  // Route routing switchboard
  const renderRoute = () => {
    // 1. Customer checkout link matching: /pay/CODE
    if (currentPath.startsWith('/pay/')) {
      return <Checkout />;
    }

    switch (currentPath) {
      case '/':
        return <Landing />;
      
      case '/login':
        return <Auth mode="login" />;
      
      case '/register':
        return <Auth mode="register" />;
      
      case '/dashboard':
        if (!user) {
          return <Auth mode="login" />;
        }
        return <Dashboard />;
      
      case '/admin':
        if (!user || user.role !== 'admin') {
          return <Admin />; // Will render the beautiful unauthorized lock page
        }
        return <Admin />;
      
      default:
        return (
          <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white space-y-4 font-sans px-6">
            <AlertCircle size={48} className="text-red-500" />
            <h1 className="text-2xl font-black">404 - Space Not Found</h1>
            <p className="text-sm text-slate-400">The gateway endpoint you are looking for does not exist on PayHub Kenya.</p>
            <a href="/" className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all">
              Return to Homepage
            </a>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Global Toast Alerts */}
      {toast && (
        <div 
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-bold transition-all animate-bounce ${
            toast.type === 'success' ? 'bg-green-500 text-white border-green-400' :
            toast.type === 'error' ? 'bg-red-500 text-white border-red-400' :
            'bg-slate-800 text-white border-slate-700'
          }`}
          id="global-toast"
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Render Active view */}
      {renderRoute()}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

