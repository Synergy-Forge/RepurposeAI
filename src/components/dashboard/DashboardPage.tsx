'use client';

import { Video, Film, Clock, TrendingUp } from 'lucide-react';
import { KPICard } from './KPICard';
import { ChartContainer } from './ChartContainer';
import { ChartData } from '@/types/dashboard';
import { trpc } from '@/lib/trpc-client';
import { Skeleton } from '@/components/ui/skeleton';

const roiChartData: ChartData = {
  labels: ['Magic Cuts', 'Captions', 'Silence Removal', 'Hashtags', 'Resizer'],
  datasets: [{
    label: 'Hours Saved',
    data: [65, 45, 25, 12, 5],
    backgroundColor: ['#4f46e5', '#8b5cf6', '#ec4899', '#f97316', '#3b82f6'],
    borderWidth: 0,
    borderRadius: 5,
  }],
};

const projectsChartData: ChartData = {
  labels: ['Completed', 'Processing', 'Draft'],
  datasets: [{
    label: 'Projects',
    data: [18, 9, 5],
    backgroundColor: ['#22c55e', '#3b82f6', '#a855f7'],
    borderWidth: 4,
  }],
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  processing: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  uploading: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  failed: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

const statusIcons: Record<string, string> = {
  completed: 'bg-green-500',
  processing: 'bg-blue-500',
  uploading: 'bg-yellow-500',
  failed: 'bg-red-500',
};

function timeAgo(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function DashboardPage() {
  const statsQuery = trpc.user.getStats.useQuery();

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsQuery.isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <KPICard
              title="Videos Processed"
              value={statsQuery.data?.videosProcessed ?? 0}
              icon={<Video className="w-7 h-7" />}
              iconColor="#4f46e5"
            />
            <KPICard
              title="Clips Generated"
              value={statsQuery.data?.clipsGenerated ?? 0}
              icon={<Film className="w-7 h-7" />}
              iconColor="#8b5cf6"
            />
            <KPICard
              title="Quota Used"
              value={`${statsQuery.data?.quotaUsed ?? 0} / ${statsQuery.data?.quotaLimit ?? 5}`}
              icon={<TrendingUp className="w-7 h-7" />}
              iconColor="#ec4899"
            />
            <KPICard
              title="Quota Remaining"
              value={Math.max(0, (statsQuery.data?.quotaLimit ?? 5) - (statsQuery.data?.quotaUsed ?? 0))}
              unit="videos"
              icon={<Clock className="w-7 h-7" />}
              iconColor="#f97316"
            />
          </>
        )}
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">ROI by Feature (Hours Saved)</h3>
              <span className="text-xs text-gray-400">Sample data</span>
            </div>
            <ChartContainer
              type="bar"
              data={roiChartData}
              height={300}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Hours' } },
                },
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Project Status</h3>
              <span className="text-xs text-gray-400">Sample data</span>
            </div>
            <ChartContainer type="pie" data={projectsChartData} height={300} />
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-card p-6">
        <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>

        {statsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : statsQuery.data?.recentActivity.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No activity yet. Upload your first video to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {statsQuery.data?.recentActivity.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`w-10 h-10 ${statusIcons[item.status] ?? 'bg-gray-500'} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-sm text-gray-500">
                    {item.clipCount > 0 ? `${item.clipCount} clip${item.clipCount !== 1 ? 's' : ''} generated` : 'Processing…'} · {timeAgo(item.updatedAt)}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize flex-shrink-0 ${statusColors[item.status] ?? 'bg-gray-100 text-gray-800'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
