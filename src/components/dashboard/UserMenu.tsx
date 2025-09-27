'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { UserSubscription } from '@/types/dashboard';

interface UserMenuProps {
  subscription?: UserSubscription;
}

export function UserMenu({ subscription }: UserMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const usagePercentage = subscription
    ? Math.round((subscription.currentUsage / subscription.usageLimit) * 100)
    : 0;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        style={{ backgroundColor: 'var(--border-color)' }}
        aria-label="User menu"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
          <AvatarFallback className="text-xs">
            {session?.user?.name ? getInitials(session.user.name) : 'U'}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="user-menu absolute right-0 mt-2 w-72 origin-top-right rounded-lg shadow-lg z-50"
        >
          <div className="p-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                <AvatarFallback>
                  {session?.user?.name ? getInitials(session.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || ''}
                </p>
              </div>
            </div>

            {/* Subscription Info */}
            {subscription && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium capitalize">
                    {subscription.plan} Plan
                  </span>
                  <span className="text-xs text-gray-500">
                    {subscription.currentUsage} / {subscription.usageLimit}
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  Renews {subscription.renewalDate.toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-1">
              <a
                href="/dashboard/settings"
                className="user-menu-item"
                onClick={() => setIsOpen(false)}
              >
                Account Settings
              </a>
              <a
                href="/dashboard/subscription"
                className="user-menu-item"
                onClick={() => setIsOpen(false)}
              >
                Subscription
              </a>
              <a
                href="/support"
                className="user-menu-item"
                onClick={() => setIsOpen(false)}
              >
                Help & Support
              </a>
              <button
                onClick={handleSignOut}
                className="user-menu-item w-full text-left text-red-600 dark:text-red-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
