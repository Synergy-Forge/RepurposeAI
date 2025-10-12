"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";

import { signIn, signOut } from "next-auth/react";
import { useVideoPolling } from "@/components/dashboard/hooks/useVideoPolling";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const utils = trpc.useUtils();
  const uploadVideoMutation = trpc.video.uploadVideo.useMutation();
  const processVideoMutation = trpc.video.processVideo.useMutation();
  const deleteVideoMutation = trpc.video.deleteVideo.useMutation();

  const getUserVideosQuery = trpc.video.getUserVideos.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Prepare polling for in-progress videos
  const inProgressIds = (getUserVideosQuery.data ?? [])
    .filter((v) => v.status !== "completed" && v.status !== "failed")
    .map((v) => v.id);
  const polling = useVideoPolling(inProgressIds, { enabled: inProgressIds.length > 0 });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('/video')) {
      setVideoFile(file);
    } else {
      toast.error('Please select a valid video file');
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) {
      toast.error('Please select a video file and enter a title');
      return;
    }

    setIsUploading(true);

    try {
      // Convert video to base64
      const arrayBuffer = await videoFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Upload video
      const uploadResult = await uploadVideoMutation.mutateAsync({
        title,
        description,
        videoData: base64,
      });

      // Process video
      await processVideoMutation.mutateAsync({
        videoId: uploadResult.videoId,
      });
      
      toast.success('Video processed successfully!');
      
      // Reset form
      setVideoFile(null);
      setTitle('');
      setDescription('');
      
      // Refresh videos list
      utils.video.getUserVideos.invalidate();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Repurpose AI</CardTitle>
            <CardDescription>
              Transform your long-form videos into engaging short-form content
            </CardDescription>
          </CardHeader>
          <CardContent>
          <Button
                className="w-full"
                onClick={() => signIn("google", { 
                  callbackUrl: "/dashboard",
                  redirect: true 
                })} >
                Sign in with Google
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
            <h1 className="text-2xl font-bold text-primary">Repurpose AI</h1>
            <Badge variant="secondary">Beta</Badge>
          </div>
                     <div className="flex items-center space-x-4">
             <Button variant="ghost" asChild>
               <Link href="/subscription">Subscription</Link>
             </Button>
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                     <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
                   </Avatar>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuItem asChild>
                   <Link href="/subscription">Subscription</Link>
                 </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Button variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to sign out?")) {
                        signOut({ callbackUrl: "/" })
                      }
                    }}
                  >
                    Sign Out
                  </Button>
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>
                Upload your long-form video to create engaging short-form content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video">Video File</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  disabled={isUploading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description"
                  disabled={isUploading}
                />
              </div>
              
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !videoFile || !title.trim()}
                className="w-full"
              >
                {isUploading ? 'Processing...' : 'Upload & Process'}
              </Button>
            </CardContent>
          </Card>

          {/* Processing Status - polling baseado em vídeos não concluídos */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>Track the progress of your video processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {inProgressIds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No videos being processed</p>
              ) : (
                (getUserVideosQuery.data ?? [])
                  .filter((v) => inProgressIds.includes(v.id))
                  .map((v) => {
                    const s = polling.dataById[v.id];
                    const status = s?.status ?? (v.status as "queued" | "processing" | "completed" | "failed");
                    const progress = s?.progress ?? (status === "processing" ? 10 : 0);
                    return (
                      <div key={v.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{v.title}</span>
                          <Badge variant={status === "completed" ? "default" : "secondary"}>{status}</Badge>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Videos List */}
        {getUserVideosQuery.data && getUserVideosQuery.data.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Videos</CardTitle>
              <CardDescription>
                View and manage your processed videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {getUserVideosQuery.data.map((video) => (
                   <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                     <CardContent className="p-4">
                       <div className="space-y-2">
                         <h3 className="font-semibold">{video.title}</h3>
                         <p className="text-sm text-muted-foreground">{video.description}</p>
                         <div className="flex items-center justify-between">
                           <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
                             {video.status}
                           </Badge>
                           <span className="text-xs text-muted-foreground">
                             {video.videoClips.length} clips
                           </span>
                         </div>
                         {video.status === 'completed' && (
                           <Button asChild className="w-full mt-2" size="sm">
                             <Link href={`/video/${video.id}`}>View Clips</Link>
                           </Button>
                         )}
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!confirm("Delete this video?")) return;
                                const tId = toast.loading("Deleting video...");
                                try {
                                  await deleteVideoMutation.mutateAsync({ videoId: video.id });
                                  toast.success("Video deleted", { id: tId });
                                  utils.video.getUserVideos.invalidate();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Delete failed", { id: tId });
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
