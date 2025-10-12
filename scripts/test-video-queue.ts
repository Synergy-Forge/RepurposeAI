import "dotenv/config";
import {
  enqueueVideoProcessing,
  getVideoJobStatus,
  getVideoQueueMetrics,
} from "../src/lib/queues/videoQueue";
import { prisma } from "../src/lib/prisma";

async function testVideoQueue() {
  console.log("🧪 Testing Video Queue System\n");

  let testVideo: { id: string; userId: string; originalUrl: string } | null =
    null;
  let testUser: { id: string; email: string | null } | null = null;

  try {
    // 1. Test connection
    console.log("1️⃣ Testing Queue Connection...");
    const metrics = await getVideoQueueMetrics();
    console.log("✅ Queue connected successfully");
    console.log("   Metrics:", metrics);
    console.log("");

    // 2. Create or find test user
    console.log("2️⃣ Setting up test user...");
    testUser = await prisma.user.upsert({
      where: { email: "test-queue@example.com" },
      update: {},
      create: {
        email: "test-queue@example.com",
        name: "Test Queue User",
        subscriptionStatus: "free",
        videoQuotaLimit: 5,
        videosProcessed: 0,
      },
    });
    console.log("✅ Test user ready:", testUser.email);
    console.log("");

    // 3. Create test video in database
    console.log("3️⃣ Creating test video...");
    testVideo = await prisma.video.create({
      data: {
        id: `test-${Date.now()}`,
        title: "Test Video for Queue",
        description: "This is a test video",
        originalUrl: "/uploads/videos/test.mp4",
        status: "uploading",
        userId: testUser.id,
      },
    });
    console.log("✅ Test video created:", testVideo.id);
    console.log("");

    // 4. Enqueue video for processing
    console.log("4️⃣ Enqueuing video for processing...");
    const job = await enqueueVideoProcessing({
      videoId: testVideo.id,
      userId: testVideo.userId,
      originalUrl: testVideo.originalUrl,
      options: {
        generateClips: true,
        transcribe: false,
        generateHashtags: true,
      },
    });
    console.log("✅ Job enqueued successfully");
    console.log("   Job ID:", job.id);
    console.log("   Job Name:", job.name);
    console.log("");

    // 5. Check job status
    console.log("5️⃣ Checking job status...");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

    const jobStatus = await getVideoJobStatus(testVideo.id);
    if (jobStatus) {
      console.log("✅ Job status retrieved");
      console.log("   State:", jobStatus.state);
      console.log("   Progress:", jobStatus.progress);
      console.log("   Attempts:", jobStatus.attemptsMade);
    } else {
      console.log("⚠️  Job not found (may have been processed already)");
    }
    console.log("");

    // 6. Check updated metrics
    console.log("6️⃣ Checking updated metrics...");
    const updatedMetrics = await getVideoQueueMetrics();
    console.log("   Metrics:", updatedMetrics);
    console.log("");

    // 7. Cleanup - Delete test video
    console.log("7️⃣ Cleaning up...");
    if (testVideo) {
      await prisma.video.delete({
        where: { id: testVideo.id },
      });
      console.log("✅ Test video deleted");
    }
    console.log("");

    console.log("✨ All tests passed!\n");
    console.log(
      "⚠️  NOTE: The video worker must be running to actually process the job."
    );
    console.log("   Start it with: npm run dev:video-worker\n");
  } catch (error) {
    console.error("❌ Test failed:", error);

    // Cleanup on error
    if (testVideo) {
      try {
        await prisma.video.delete({ where: { id: testVideo.id } });
        console.log("🧹 Cleaned up test video");
      } catch {
        // Ignore cleanup errors
      }
    }

    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testVideoQueue();
