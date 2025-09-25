'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { UserSubscription } from '@/types/dashboard';
import { useAppStore } from '@/lib/store';

interface HeaderProps {
  subscription?: UserSubscription;
  onSidebarToggle?: () => void;
}

export function Header({ subscription, onSidebarToggle }: HeaderProps) {
  const pathname = usePathname();
  const { setSidebarOpen } = useAppStore();

  const getPageTitle = (path: string): string => {
    const titleMap: Record<string, string> = {
      '/dashboard': 'Your Investment Overview',
      '/dashboard/upload': 'Make a New Upload',
      '/dashboard/ai-clips': 'AI Clip Finder',
      '/dashboard/projects': 'My Projects',
      '/dashboard/templates': 'Video Templates',
      '/dashboard/editor': 'Video Editor',
      '/dashboard/settings': 'Settings',
    };

    return titleMap[path] || 'Dashboard';
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(true);
    onSidebarToggle?.();
  };

  return (
    <header className="dashboard-header flex-shrink-0 flex items-center justify-between h-20 px-6">
      <div className="flex items-center">
        {/* Mobile menu toggle */}
        <button
          onClick={handleSidebarToggle}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 -ml-2 mr-2"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <h1 className="text-2xl font-bold title-gradient">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <UserMenu subscription={subscription} />
        
        <button className="dashboard-btn btn-success ml-4 px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">
          Export Video
        </button>
      </div>
    </header>
  );
}
