import { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ClipEditor } from "@/components/dashboard/ClipEditor";

export const metadata: Metadata = {
  title: "Edit Clip - RepurposeAI",
  description: "Trim, re-style, and re-render an AI-generated clip.",
};

export default async function ClipEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <ClipEditor clipId={id} />
    </DashboardLayout>
  );
}
