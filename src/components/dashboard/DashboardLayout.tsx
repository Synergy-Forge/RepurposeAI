'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserSubscription } from '@/types/dashboard';
import { useAppStore } from '@/lib/store';

interface DashboardLayoutProps {
  children: React.ReactNode;
  subscription?: UserSubscription;
}

export function DashboardLayout({ children, subscription }: DashboardLayoutProps) {
  const { sidebarOpen, setSidebarOpen, theme } = useAppStore();
  const { data: _session, status } = useSession();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = 'dashboard-body';
    
    return () => {
      document.body.className = '';
    };
  }, [theme]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will handle this)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="w-full h-screen flex dashboard-body">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={!sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Wrapper */}
      <div 
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300
          ${!sidebarOpen ? 'md:ml-16' : 'md:ml-72'}
        `}
      >
        {/* Header */}
        <Header 
          subscription={subscription}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-6 dashboard-scrollbar">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
