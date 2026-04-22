'use client';

import { Edit3 } from 'lucide-react';

export function EditorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="dashboard-card p-12 max-w-md w-full">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <Edit3 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Video Editor</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The full video editor is coming soon. In the meantime, your AI-generated clips are available on each video&apos;s detail page.
        </p>
        <span className="inline-block bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
