export type VideoClip = {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  aspectRatio: string;
  videoUrl: string;
  captions: string | null;
  hashtags: string | null;
  videoId: string;
  createdAt: string;
};

export type Video = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  clips: VideoClip[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  originalUrl: string;
  duration: number | null;
};