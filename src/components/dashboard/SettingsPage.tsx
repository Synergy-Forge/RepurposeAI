'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { User, Bell, Shield, CreditCard, Download, Trash2, Palette, Upload as UploadIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SettingsSection } from '@/types/dashboard';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

const PRO_PLANS = new Set(['pro', 'enterprise', 'creator', 'producer']);

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter Plan',
  creator: 'Creator Plan',
  producer: 'Producer Plan',
  free: 'Free Plan',
  paused: 'Paused',
};

const settingsSections: SettingsSection[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy & Security' },
  { id: 'branding', label: 'Branding' },
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const emailPrefsQuery = trpc.email.getUserPreferences.useQuery();
  const subscriptionQuery = trpc.user.getSubscriptionStatus.useQuery();
  const brandingQuery = trpc.template.getUserBranding.useQuery();
  const utils = trpc.useUtils();

  const [brandingDraft, setBrandingDraft] = useState<{
    primaryColor: string;
    watermarkEnabled: boolean;
  }>({ primaryColor: '#6366f1', watermarkEnabled: false });
  const [pendingLogo, setPendingLogo] = useState<{ base64: string; previewUrl: string } | null>(null);
  const [clearLogoRequested, setClearLogoRequested] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const updateBranding = trpc.template.updateUserBranding.useMutation({
    onSuccess: () => {
      toast.success('Branding saved');
      setPendingLogo(null);
      setClearLogoRequested(false);
      utils.template.getUserBranding.invalidate();
    },
    onError: (err) => toast.error(err.message || 'Failed to save branding'),
  });

  useEffect(() => {
    if (brandingQuery.data) {
      setBrandingDraft({
        primaryColor: brandingQuery.data.primaryColor ?? '#6366f1',
        watermarkEnabled: brandingQuery.data.watermarkEnabled,
      });
    }
  }, [brandingQuery.data]);

  const onPickLogo = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a PNG or JPEG image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be 2MB or smaller');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      setPendingLogo({ base64, previewUrl: result });
      setClearLogoRequested(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = () => {
    updateBranding.mutate({
      primaryColor: brandingDraft.primaryColor,
      watermarkEnabled: brandingDraft.watermarkEnabled,
      logoBase64: clearLogoRequested ? null : pendingLogo?.base64,
    });
  };
  const updateProfile = trpc.user.updateProfile.useMutation();
  const updateEmailPrefs = trpc.email.updatePreferences.useMutation();
  const portalMutation = trpc.subscription.createPortalSession.useMutation({
    onSuccess: (data) => { window.location.href = data.url; },
    onError: (err) => toast.error(err.message),
  });
  const deleteAccountMutation = trpc.user.deleteAccount.useMutation({
    onSuccess: () => signOut({ callbackUrl: '/' }),
    onError: (err) => toast.error(err.message),
  });
  const changePasswordMutation = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError(null);
    },
    onError: (err) => {
      setPasswordError(err.message);
    },
  });

  const handleChangePassword = () => {
    setPasswordError(null);
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

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

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium mb-2">Change Password</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Update the password you use to sign in. OAuth-only accounts (Google) can&apos;t change a password here.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="dashboard-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="dashboard-input"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            )}
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={
                changePasswordMutation.isPending ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
              className="dashboard-btn btn-primary px-4 py-2 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </div>

        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
          <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Danger Zone</h4>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            This action cannot be undone. This will permanently delete your account and all associated data.
          </p>
          <button
            disabled={deleteAccountMutation.isPending}
            onClick={() => {
              if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                deleteAccountMutation.mutate();
              }
            }}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            {deleteAccountMutation.isPending ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderBrandingSection = () => {
    const plan = subscriptionQuery.data?.status ?? 'free';
    const isProPlan = PRO_PLANS.has(plan.toLowerCase());
    const currentLogoUrl = brandingQuery.data?.logoUrl;
    const logoPreview = pendingLogo?.previewUrl
      ? pendingLogo.previewUrl
      : clearLogoRequested
        ? null
        : currentLogoUrl ?? null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Branding</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Apply your brand to generated clips. Your logo is composited onto each clip when the watermark is enabled.
        </p>

        {!isProPlan && (
          <div className="p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-sm">
            Custom branding is available on the Pro plan and above. Upgrade to enable the watermark.
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="block text-sm font-medium mb-3">Logo</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Brand logo"
                    width={96}
                    height={96}
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickLogo(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={!isProPlan}
                  className="dashboard-btn btn-primary px-4 py-2 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <UploadIcon className="w-4 h-4" />
                  Choose PNG or JPEG
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingLogo(null);
                      setClearLogoRequested(true);
                    }}
                    className="text-sm text-gray-500 hover:text-red-600"
                  >
                    Remove logo
                  </button>
                )}
                <p className="text-xs text-gray-500">Max 2MB. Will be scaled down automatically.</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <label className="block text-sm font-medium mb-2">Primary color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingDraft.primaryColor}
                onChange={(e) =>
                  setBrandingDraft((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
              />
              <input
                type="text"
                value={brandingDraft.primaryColor}
                onChange={(e) =>
                  setBrandingDraft((prev) => ({ ...prev, primaryColor: e.target.value }))
                }
                className="dashboard-input w-32"
                placeholder="#6366f1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Reserved for future use (caption accents, email footers). Stored with your profile.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium">Watermark on clips</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Overlay your logo in the top-right corner of every rendered clip.
              </p>
            </div>
            <input
              type="checkbox"
              checked={brandingDraft.watermarkEnabled}
              disabled={!isProPlan}
              onChange={(e) =>
                setBrandingDraft((prev) => ({ ...prev, watermarkEnabled: e.target.checked }))
              }
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleSaveBranding}
              disabled={updateBranding.isPending}
              className="dashboard-btn btn-primary px-6 py-2 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateBranding.isPending ? 'Saving…' : 'Save branding'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBillingSection = () => {
    const sub = subscriptionQuery.data;
    const status = sub?.status ?? 'free';
    const planLabel = PLAN_LABELS[status] ?? 'Free Plan';
    const isActive = status !== 'free' && status !== 'paused';
    const endDate = sub?.endDate
      ? new Date(sub.endDate).toLocaleDateString()
      : null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Billing & Subscription</h3>

        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Current Plan</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscriptionQuery.isLoading ? 'Loading…' : planLabel}
              </p>
              {endDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Renews / ends {endDate}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {isActive ? 'Active' : status === 'paused' ? 'Paused' : 'Free'}
            </span>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => portalMutation.mutate({ returnUrl: window.location.href })}
              disabled={portalMutation.isPending}
              className="dashboard-btn btn-primary px-4 py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {portalMutation.isPending ? 'Redirecting…' : 'Manage Subscription'}
            </button>
            <button
              onClick={() => portalMutation.mutate({ returnUrl: window.location.href })}
              disabled={portalMutation.isPending}
              className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              View Usage
            </button>
          </div>
        </div>
      </div>
    );
  };

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
      case 'branding':
        return renderBrandingSection();
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
                  {section.id === 'branding' && <Palette className="w-4 h-4" />}
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
