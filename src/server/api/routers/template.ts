import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/lib/trpc";
import { buildUploadsPath, storageProvider } from "@/lib/storage";

const PRO_PLANS = new Set(["pro", "enterprise", "creator", "producer"]);

const brandingInputSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional()
    .nullable(),
  watermarkEnabled: z.boolean().optional(),
  logoBase64: z
    .string()
    .optional()
    .nullable()
    .describe("PNG or JPEG logo encoded as base64. Pass null to clear the existing logo."),
});

export const templateRouter = createTRPCRouter({
  /**
   * Returns all system video templates, newest first. Public so the landing
   * page / marketing flows can surface them even for logged-out visitors.
   */
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.videoTemplate.findMany({
      where: { isSystem: true },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    });
  }),

  /** Fetches a single template by slug. */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.prisma.videoTemplate.findUnique({
        where: { slug: input.slug },
      });
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Template "${input.slug}" not found`,
        });
      }
      return template;
    }),

  /** Returns the current user's branding settings (or null if never set). */
  getUserBranding: protectedProcedure.query(async ({ ctx }) => {
    const branding = await ctx.prisma.userBranding.findUnique({
      where: { userId: ctx.session.user.id },
    });
    return branding;
  }),

  /**
   * Updates or creates the branding row for the current user. Accepts an
   * optional base64-encoded logo; when provided, stores it via the shared
   * storage provider and replaces any previously saved logo. Only paid plans
   * can enable the watermark (UI should hide this for free users, but enforce
   * the plan gate on the server too).
   */
  updateUserBranding: protectedProcedure
    .input(brandingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const isProPlan = PRO_PLANS.has(
        (user.subscriptionStatus ?? "free").toLowerCase()
      );

      if (input.watermarkEnabled && !isProPlan) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Custom branding is available on Pro and above. Upgrade to enable the watermark.",
        });
      }

      const existing = await ctx.prisma.userBranding.findUnique({
        where: { userId },
      });

      let newLogoUrl: string | null | undefined;
      if (input.logoBase64 === null) {
        // Explicit request to clear the logo
        newLogoUrl = null;
      } else if (input.logoBase64) {
        const buffer = Buffer.from(input.logoBase64, "base64");
        const maxBytes = 2 * 1024 * 1024; // 2MB cap for branding logos
        if (buffer.byteLength > maxBytes) {
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Logo must be 2MB or smaller.",
          });
        }
        const magic = buffer.slice(0, 4).toString("hex");
        const isPng = magic.startsWith("89504e47");
        const isJpeg = magic.startsWith("ffd8ff");
        if (!isPng && !isJpeg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Logo must be a PNG or JPEG image.",
          });
        }
        const extension = isPng ? "png" : "jpg";
        const fileName = `${randomUUID()}.${extension}`;
        const relativePath = buildUploadsPath(
          "uploads",
          "branding",
          userId,
          fileName
        );
        newLogoUrl = await storageProvider.save(buffer, relativePath);
      }

      const branding = await ctx.prisma.userBranding.upsert({
        where: { userId },
        create: {
          userId,
          primaryColor: input.primaryColor ?? null,
          watermarkEnabled: input.watermarkEnabled ?? false,
          logoUrl: newLogoUrl ?? null,
        },
        update: {
          ...(input.primaryColor !== undefined
            ? { primaryColor: input.primaryColor }
            : {}),
          ...(input.watermarkEnabled !== undefined
            ? { watermarkEnabled: input.watermarkEnabled }
            : {}),
          ...(newLogoUrl !== undefined ? { logoUrl: newLogoUrl } : {}),
        },
      });

      // Best-effort cleanup of the old logo file if we replaced or cleared it
      if (
        newLogoUrl !== undefined &&
        existing?.logoUrl &&
        existing.logoUrl !== branding.logoUrl
      ) {
        await storageProvider
          .delete(existing.logoUrl.replace(/^\//, ""))
          .catch((err) =>
            console.error("[template:updateUserBranding] Failed to delete old logo:", err)
          );
      }

      return branding;
    }),
});
