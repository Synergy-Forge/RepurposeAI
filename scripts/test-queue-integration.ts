import "dotenv/config";
import { enqueueVideoProcessing } from "../src/lib/queues/videoQueue";
import { prisma } from "../src/lib/prisma";

async function testQueueIntegration() {
  console.log("🧪 Testing Video Queue Integration\n");
  console.log("⚠️  This test requires the video worker to be running!");
  console.log("   Start it with: npm run dev:video-worker\n");

  let testUser: { id: string; email: string | null } | null = null;
  let testVideo: { id: string; userId: string; originalUrl: string; status: string } | null = null;

  try {
    // 1. Setup test user
    console.log("1️⃣ Setting up test user...");
    testUser = await prisma.user.upsert({
      where: { email: "test-integration@example.com" },
      update: {},
      create: {
        email: "test-integration@example.com",
        name: "Test Integration User",
        subscriptionStatus: "free",
        videoQuotaLimit: 5,
        videosProcessed: 0,
      },
    });
    console.log("✅ Test user ready:", testUser.email);
    console.log("");

    // 2. Create test video
    console.log("2️⃣ Creating test video...");
    testVideo = await prisma.video.create({
      data: {
        id: `integration-test-${Date.now()}`,
        title: "Integration Test Video",
        description: "This video tests the full queue flow",
        originalUrl: "/uploads/videos/test.mp4",
        status: "uploading",
        userId: testUser.id,
      },
    });
    console.log("✅ Test video created:", testVideo.id);
    console.log("");

    // 3. Enqueue for processing
    console.log("3️⃣ Enqueuing video for processing...");
    const job = await enqueueVideoProcessing({
      videoId: testVideo.id,
      userId: testUser.id,
      originalUrl: testVideo.originalUrl,
      options: {
        generateClips: true,
        transcribe: false,
        generateHashtags: true,
      },
    });
    console.log("✅ Job enqueued:", job.id);
    console.log("");

    // 4. Monitor processing
    console.log("4️⃣ Monitoring processing status...");
    console.log("   (Press Ctrl+C to stop monitoring)");
    console.log("");

    let previousStatus = "";
    let checks = 0;
    const maxChecks = 60; // 2 minutes max

    while (checks < maxChecks) {
      const video = await prisma.video.findUnique({
        where: { id: testVideo.id },
        include: { videoClips: true },
      });

      if (!video) {
        console.log("❌ Video not found");
        break;
      }

      const status = video.status;

      if (status !== previousStatus) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`   [${timestamp}] Status: ${status}`);

        if (status === "completed") {
          console.log(`   ✅ Video processed successfully!`);
          console.log(`   📹 Clips generated: ${video.videoClips.length}`);
          console.log("");
          break;
        } else if (status === "failed") {
          console.log(`   ❌ Video processing failed`);
          console.log("");
          break;
        }

        previousStatus = status;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Check every 2 seconds
      checks++;
    }

    if (checks >= maxChecks) {
      console.log("⚠️  Timeout: Processing took too long");
      console.log("   Check if the worker is running and processing jobs");
    }

    console.log("");

    // 5. Show final results
    console.log("5️⃣ Final Results:");
    const finalVideo = await prisma.video.findUnique({
      where: { id: testVideo.id },
      include: { videoClips: true },
    });

    if (finalVideo) {
      console.log(`   Status: ${finalVideo.status}`);
      console.log(`   Clips: ${finalVideo.videoClips.length}`);
      console.log(`   Updated: ${finalVideo.updatedAt.toLocaleString()}`);
    }
    console.log("");

    // 6. Cleanup
    console.log("6️⃣ Cleaning up...");
    if (testVideo) {
      await prisma.video.delete({ where: { id: testVideo.id } });
      console.log("✅ Test video deleted");
    }
    console.log("");

    console.log("✨ Integration test completed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);

    // Cleanup on error
    if (testVideo) {
      try {
        await prisma.video.delete({ where: { id: testVideo.id } });
      } catch {
        // Ignore
      }
    }

    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testQueueIntegration();
