import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    subscriptionStatus: 'free' | 'starter' | 'creator' | 'producer';
  } | null;
  setUser: (user: UserState['user']) => void;
  clearUser: () => void;
}

interface VideoProcessingState {
  processingVideos: Array<{
    id: string;
    title: string;
    status: 'uploading' | 'processing' | 'completed' | 'failed';
    progress: number;
  }>;
  addProcessingVideo: (
    video: VideoProcessingState['processingVideos'][0]
  ) => void;
  updateVideoStatus: (
    id: string,
    status: VideoProcessingState['processingVideos'][0]['status'],
    progress?: number
  ) => void;
  removeProcessingVideo: (id: string) => void;
}

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

type AppState = UserState & VideoProcessingState & UIState;

export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      // Video processing state
      processingVideos: [],
      addProcessingVideo: (video) =>
        set((state) => ({
          processingVideos: [...state.processingVideos, video],
        })),
      updateVideoStatus: (id, status, progress = 0) =>
        set((state) => ({
          processingVideos: state.processingVideos.map((video) =>
            video.id === id ? { ...video, status, progress } : video
          ),
        })),
      removeProcessingVideo: (id) =>
        set((state) => ({
          processingVideos: state.processingVideos.filter(
            (video) => video.id !== id
          ),
        })),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'repurpose-ai-store',
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
      }),
    }
  )
);
