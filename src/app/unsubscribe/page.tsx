import { Suspense } from "react";
import { Metadata } from "next";
import { UnsubscribeClient } from "./UnsubscribeClient";

export const metadata: Metadata = {
  title: "Unsubscribe - RepurposeAI",
  description: "Unsubscribe from RepurposeAI email notifications.",
};

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
        <UnsubscribeClient />
      </Suspense>
    </div>
  );
}
