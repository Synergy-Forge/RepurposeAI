import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import { processVideoToExtractKeyMoments } from '@/lib/video-processing';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const uploadVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  videoData: z.string(), // Base64 encoded video data
});

const processVideoSchema = z.object({
  videoId: z.string(),
});

export const videoRouter = createTRPCRouter({
  uploadVideo: protectedProcedure
    .input(uploadVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const { title, description, videoData } = input;
      const userId = ctx.session.user.id;

      // Decode base64 video data
      const videoBuffer = Buffer.from(videoData, 'base64');
      const videoFileName = `${randomUUID()}.mp4`;
      const videoPath = join(tmpdir(), videoFileName);

      try {
        // Save video to temporary storage
        await writeFile(videoPath, videoBuffer);

        // Create video record in database
        const video = await ctx.prisma.video.create({
          data: {
            title,
            description,
            originalUrl: videoPath,
            userId,
            status: 'uploading',
          },
        });

        return {
          success: true,
          videoId: video.id,
          message: 'Video uploaded successfully',
        };
      } catch (error) {
        console.error('Error uploading video:', error);
        throw new Error('Failed to upload video');
      }
    }),

  processVideo: protectedProcedure
    .input(processVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      // Get video from database
      const video = await ctx.prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      try {
        // Update video status to processing
        await ctx.prisma.video.update({
          where: { id: videoId },
          data: { status: 'processing' },
        });

        // Process video to extract key moments
        const processedClips = await processVideoToExtractKeyMoments(
          video.originalUrl,
          video.title
        );

        // Save processed clips to database
        const savedClips = await Promise.all(
          processedClips.map((clip) =>
            ctx.prisma.videoClip.create({
              data: {
                title: clip.title,
                description: clip.description,
                startTime: clip.startTime,
                endTime: clip.endTime,
                aspectRatio: clip.aspectRatio,
                videoUrl: clip.videoUrl,
                captions: clip.captions,
                hashtags: clip.hashtags,
                videoId,
              },
            })
          )
        );

        // Update video status to completed
        await ctx.prisma.video.update({
          where: { id: videoId },
          data: { status: 'completed' },
        });

        return {
          success: true,
          clips: savedClips,
          message: 'Video processed successfully',
        };
      } catch (error) {
        // Update video status to failed
        await ctx.prisma.video.update({
          where: { id: videoId },
          data: { status: 'failed' },
        });

        console.error('Error processing video:', error);
        throw new Error('Failed to process video');
      }
    }),

  getUserVideos: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const videos = await ctx.prisma.video.findMany({
      where: { userId },
      include: {
        clips: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return videos;
  }),

  getVideoWithClips: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      const video = await ctx.prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
        },
        include: {
          clips: true,
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      return video;
    }),

  deleteVideo: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      // Check if video belongs to user
      const video = await ctx.prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
        },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      try {
        // Delete video and all associated clips
        await ctx.prisma.video.delete({
          where: { id: videoId },
        });

        // Clean up video file
        await unlink(video.originalUrl);

        return {
          success: true,
          message: 'Video deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting video:', error);
        throw new Error('Failed to delete video');
      }
    }),
});
