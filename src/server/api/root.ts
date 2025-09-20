import { createTRPCRouter } from '@/lib/trpc';
import { videoRouter } from './routers/video';
import { userRouter } from './routers/user';
import { subscriptionRouter } from './routers/subscription';
import { emailRouter } from './routers/email';

export const appRouter = createTRPCRouter({
  video: videoRouter,
  user: userRouter,
  subscription: subscriptionRouter,
  email: emailRouter,
});

export type AppRouter = typeof appRouter;
