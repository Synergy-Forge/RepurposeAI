'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Upload, 
  Sparkles, 
  FolderOpen, 
  Layout, 
  Edit3, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { SidebarNavItem } from '@/types/dashboard';
import { useAppStore } from '@/lib/store';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  const navigationItems: SidebarNavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Upload',
      href: '/dashboard/upload',
      icon: <Upload className="w-5 h-5" />,
    },
    {
      label: 'AI Clips',
      href: '/dashboard/ai-clips',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      label: 'Projects',
      href: '/dashboard/projects',
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      label: 'Templates',
      href: '/dashboard/templates',
      icon: <Layout className="w-5 h-5" />,
    },
    {
      label: 'Editor',
      href: '/dashboard/editor',
      icon: <Edit3 className="w-5 h-5" />,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    onToggle?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          dashboard-sidebar fixed md:static inset-y-0 left-0 z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-72'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          h-screen p-4 space-y-4
        `}
      >
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 p-2">
              <Image
                src="https://i.ibb.co/L5k3v2z/logo-fenix-repai_fundo_azul.jpg"
                alt="Phoenix Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <h1 className="text-xl font-bold text-white">AI CUTS</h1>
            </div>
          )}
          
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      sidebar-item flex items-center space-x-3 p-3 transition-all
                      ${isActive ? 'active' : ''}
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    onClick={() => setSidebarOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle (Desktop) */}
        {!isCollapsed && (
          <div className="hidden md:block pt-4 border-t border-white/20">
            <button
              onClick={onToggle}
              className="w-full p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all text-sm"
            >
              Collapse Menu
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
