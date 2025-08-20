'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = params.id as string;

  const { data: video, isLoading, error } = trpc.video.getVideoWithClips.useQuery(
    { videoId },
    { enabled: !!videoId }
  );

  const handleDownload = (clipUrl: string, title: string, aspectRatio: string) => {
    // Create a temporary link to download the video
    const link = document.createElement('a');
    link.href = clipUrl;
    link.download = `${title}_${aspectRatio}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${title} (${aspectRatio})`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Video not found or you don't have permission to view it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/">Go Back</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <a href="/">← Back</a>
            </Button>
            <h1 className="text-2xl font-bold">{video.title}</h1>
            <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
              {video.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Video Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Video Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Title</h3>
                <p className="text-muted-foreground">{video.title}</p>
              </div>
              {video.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{video.description}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
                  {video.status}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Created</h3>
                <p className="text-muted-foreground">
                  {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Clips */}
        {video.clips.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Generated Clips</h2>
            
            {/* Group clips by title */}
            {Array.from(new Set(video.clips.map(clip => clip.title))).map((title) => {
              const clipsForTitle = video.clips.filter(clip => clip.title === title);
              const firstClip = clipsForTitle[0];
              
              return (
                <Card key={title}>
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{firstClip.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {clipsForTitle.map((clip) => (
                        <Card key={clip.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">{clip.aspectRatio}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {clip.startTime}s - {clip.endTime}s
                                </span>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Captions</p>
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {clip.captions}
                                </p>
                              </div>
                              
                              {clip.hashtags && (
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Hashtags</p>
                                  <div className="flex flex-wrap gap-1">
                                    {clip.hashtags.split(' ').map((tag, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <Button
                                onClick={() => handleDownload(clip.videoUrl, clip.title, clip.aspectRatio)}
                                className="w-full"
                                size="sm"
                              >
                                Download {clip.aspectRatio}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {video.status === 'completed' 
                  ? 'No clips were generated for this video.'
                  : 'Video is still being processed. Please wait...'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
