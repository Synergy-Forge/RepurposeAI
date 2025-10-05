/**
 * Test script to verify Prisma Client has the new quota fields
 * Run with: npx tsx scripts/test-quota-fields.ts
 */

import { PrismaClient } from '@prisma/client';

async function testQuotaFields() {
  const prisma = new PrismaClient();
  let createdUserId: string | null = null;

  try {
    console.log('== Testing Prisma Client quota fields...\n');

    // Test 1: Check if fields exist in type system
    console.log('-- TypeScript types check');
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        videosProcessed: true,
        videoQuotaLimit: true,
        subscriptionStatus: true,
      },
    });

    if (user) {
      console.log('  - videosProcessed:', user.videosProcessed);
      console.log('  - videoQuotaLimit:', user.videoQuotaLimit);
      console.log('  - subscriptionStatus:', user.subscriptionStatus);
    } else {
      console.log('  - No users found in database');
    }

    // Test 2: Check update operation on a temporary user
    console.log('\n-- Mutation smoke test');
    const testEmail = `quota-test-${Date.now()}@example.com`;

    const createdUser = await prisma.user.create({
      data: {
        email: testEmail,
        videosProcessed: 0,
        videoQuotaLimit: 2,
        subscriptionStatus: 'free',
      },
      select: {
        id: true,
        videosProcessed: true,
        videoQuotaLimit: true,
      },
    });

    createdUserId = createdUser.id;
    console.log(`  - Created test user ${createdUserId}`);

    const updatedUser = await prisma.user.update({
      where: { id: createdUserId },
      data: {
        videosProcessed: { increment: 1 },
      },
      select: { videosProcessed: true },
    });

    if (updatedUser.videosProcessed !== createdUser.videosProcessed + 1) {
      throw new Error('videosProcessed increment did not persist as expected');
    }

    console.log(`  - Incremented videosProcessed to ${updatedUser.videosProcessed}`);

    console.log('\nAll Prisma Client quota field tests passed!');
  } catch (error) {
    console.error('Error testing quota fields:', error);
    throw error;
  } finally {
    if (createdUserId) {
      await prisma.user
        .delete({ where: { id: createdUserId } })
        .catch((cleanupError) => {
          console.error(`Failed to clean up test user ${createdUserId}:`, cleanupError);
        });
    }

    await prisma.$disconnect();
  }
}

testQuotaFields();
