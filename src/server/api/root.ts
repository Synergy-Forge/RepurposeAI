import { createTRPCRouter } from '@/lib/trpc';
import { videoRouter } from './routers/video';
import { userRouter } from './routers/user';
import { subscriptionRouter } from './routers/subscription';

export const appRouter = createTRPCRouter({
  video: videoRouter,
  user: userRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
