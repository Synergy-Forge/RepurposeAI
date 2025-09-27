export interface DashboardMetrics {
  timeSaved: number;
  videosProcessed: number;
  wordsTranscribed: number;
  hashtagsCreated: number;
}

export interface Project {
  id: string;
  name: string;
  status: 'completed' | 'processing' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
  duration?: number;
  size?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  category: string;
  isPopular?: boolean;
}

export interface AIClipFinderParams {
  videoId: string;
  clipLength: number;
  audience: 'general' | 'business' | 'educational' | 'entertainment';
  platform: 'youtube' | 'tiktok' | 'instagram' | 'linkedin';
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  videoId?: string;
}

export interface UserSubscription {
  plan: 'free' | 'starter' | 'creator' | 'producer';
  usageLimit: number;
  currentUsage: number;
  renewalDate: Date;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    borderRadius?: number;
  }>;
}

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

export interface SettingsSection {
  id: string;
  label: string;
  isActive?: boolean;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconColor: string;
}

export interface EditorTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  isActive?: boolean;
}

export type DashboardPage = 
  | 'dashboard' 
  | 'upload' 
  | 'ai-clips' 
  | 'projects' 
  | 'templates' 
  | 'editor' 
  | 'settings';
