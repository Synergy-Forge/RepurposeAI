'use client';

import { Layout } from 'lucide-react';

export function TemplatesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="dashboard-card p-12 max-w-md w-full">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <Layout className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h1 className="text-2xl font-bold mb-3">Video Templates</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Professionally designed templates for short-form content are on their way. Stay tuned for updates.
        </p>
        <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 py-1.5 rounded-full text-sm font-medium">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
