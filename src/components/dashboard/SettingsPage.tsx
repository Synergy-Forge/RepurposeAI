'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Bell, Shield, CreditCard, Download, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SettingsSection } from '@/types/dashboard';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

const settingsSections: SettingsSection[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'export', label: 'Export Data' },
];

export function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    displayName: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: '',
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    processingComplete: true,
    newFeatures: false,
    profileVisibility: 'private',
    dataSharing: false,
    analyticsTracking: true,
  });

  const emailPrefsQuery = trpc.email.getUserPreferences.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();
  const updateEmailPrefs = trpc.email.updatePreferences.useMutation();

  useEffect(() => {
    if (emailPrefsQuery.data) {
      setSettings((prev) => ({
        ...prev,
        emailNotifications: emailPrefsQuery.data.processingUpdates,
        weeklyReports: emailPrefsQuery.data.weeklyDigest,
        newFeatures: emailPrefsQuery.data.featureAnnouncements,
        processingComplete: emailPrefsQuery.data.processingUpdates,
      }));
    }
  }, [emailPrefsQuery.data]);

  const updateSetting = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateProfile.mutateAsync({
          name: settings.displayName || undefined,
          email: settings.email || undefined,
        }),
        updateEmailPrefs.mutateAsync({
          marketingEmails: settings.emailNotifications,
          processingUpdates: settings.processingComplete,
          weeklyDigest: settings.weeklyReports,
          featureAnnouncements: settings.newFeatures,
        }),
      ]);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        
        {/* Avatar */}
        <div className="flex items-center space-x-6 mb-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src={session?.user?.image || ''} alt={settings.displayName} />
            <AvatarFallback className="text-lg">
              {settings.displayName ? getInitials(settings.displayName) : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <button className="dashboard-btn btn-primary px-4 py-2 rounded text-sm">
              Change Avatar
            </button>
            <button className="block text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Remove Avatar
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => updateSetting('displayName', e.target.value)}
              className="dashboard-input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting('email', e.target.value)}
              className="dashboard-input"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            value={settings.bio}
            onChange={(e) => updateSetting('bio', e.target.value)}
            placeholder="Tell us a bit about yourself..."
            rows={3}
            className="dashboard-input resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">Email Notifications</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive notifications via email
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">Push Notifications</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive push notifications in your browser
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.pushNotifications}
            onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">Processing Complete</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get notified when video processing is complete
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.processingComplete}
            onChange={(e) => updateSetting('processingComplete', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">Weekly Reports</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receive weekly analytics and usage reports
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.weeklyReports}
            onChange={(e) => updateSetting('weeklyReports', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">New Features</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Be the first to know about new features and updates
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.newFeatures}
            onChange={(e) => updateSetting('newFeatures', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Privacy & Security</h3>
      
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <label className="block text-sm font-medium mb-2">Profile Visibility</label>
          <select
            value={settings.profileVisibility}
            onChange={(e) => updateSetting('profileVisibility', e.target.value)}
            className="dashboard-input"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="team">Team Only</option>
          </select>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Control who can see your profile information
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">Data Sharing</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow anonymous usage data to improve our services
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.dataSharing}
            onChange={(e) => updateSetting('dataSharing', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <h4 className="font-medium">Analytics Tracking</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow us to track your usage for analytics purposes
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.analyticsTracking}
            onChange={(e) => updateSetting('analyticsTracking', e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Danger Zone</h4>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            This action cannot be undone. This will permanently delete your account and all associated data.
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Billing & Subscription</h3>
      
      <div className="dashboard-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium">Current Plan</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Creator Plan</p>
          </div>
          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            Active
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">$29</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">per month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">250</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">videos/month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">∞</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">exports</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="dashboard-btn btn-primary px-4 py-2 rounded">
            Upgrade Plan
          </button>
          <button className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            View Usage
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Payment Method</h4>
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/25</p>
              </div>
            </div>
            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium">
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExportSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
      
      <div className="space-y-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">Account Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a copy of your account information, settings, and preferences.
          </p>
          <button className="dashboard-btn btn-primary px-4 py-2 rounded text-sm">
            <Download className="w-4 h-4 inline mr-2" />
            Export Account Data
          </button>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">Project Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download all your projects, including original files and processed outputs.
          </p>
          <button className="dashboard-btn btn-primary px-4 py-2 rounded text-sm">
            <Download className="w-4 h-4 inline mr-2" />
            Export Projects
          </button>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">Analytics Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Export your usage analytics and performance metrics.
          </p>
          <button className="dashboard-btn btn-primary px-4 py-2 rounded text-sm">
            <Download className="w-4 h-4 inline mr-2" />
            Export Analytics
          </button>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'privacy':
        return renderPrivacySection();
      case 'billing':
        return renderBillingSection();
      case 'export':
        return renderExportSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Settings Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="dashboard-card p-4">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  settings-nav-item w-full text-left
                  ${activeSection === section.id ? 'active' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  {section.id === 'profile' && <User className="w-4 h-4" />}
                  {section.id === 'notifications' && <Bell className="w-4 h-4" />}
                  {section.id === 'privacy' && <Shield className="w-4 h-4" />}
                  {section.id === 'billing' && <CreditCard className="w-4 h-4" />}
                  {section.id === 'export' && <Download className="w-4 h-4" />}
                  <span>{section.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1">
        <div className="dashboard-card p-6">
          {renderSection()}
          
          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="dashboard-btn btn-primary px-6 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="border border-gray-300 dark:border-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
