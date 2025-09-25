'use client';

import { Clock, Video, FileText, Hash } from 'lucide-react';
import { KPICard } from './KPICard';
import { ChartContainer } from './ChartContainer';
import { DashboardMetrics, ChartData } from '@/types/dashboard';

interface DashboardPageProps {
  metrics?: DashboardMetrics;
}

// Mock data - replace with real data from your API
const defaultMetrics: DashboardMetrics = {
  timeSaved: 152,
  videosProcessed: 890,
  wordsTranscribed: 1200000,
  hashtagsCreated: 5800,
};

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

export function DashboardPage({ metrics = defaultMetrics }: DashboardPageProps) {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Time Saved"
          value={metrics.timeSaved}
          unit="hours"
          icon={<Clock className="w-7 h-7" />}
          iconColor="#4f46e5"
        />
        <KPICard
          title="Videos Processed"
          value={metrics.videosProcessed}
          unit="min"
          icon={<Video className="w-7 h-7" />}
          iconColor="#8b5cf6"
        />
        <KPICard
          title="Words Transcribed"
          value={`${(metrics.wordsTranscribed / 1000000).toFixed(1)}M`}
          icon={<FileText className="w-7 h-7" />}
          iconColor="#ec4899"
        />
        <KPICard
          title="Hashtags Created"
          value={`${(metrics.hashtagsCreated / 1000).toFixed(1)}k`}
          icon={<Hash className="w-7 h-7" />}
          iconColor="#f97316"
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ROI Chart */}
        <div className="lg:col-span-3">
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-semibold mb-4">ROI by Feature (Hours Saved)</h3>
            <ChartContainer
              type="bar"
              data={roiChartData}
              height={300}
              options={{
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Hours',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Projects Status Chart */}
        <div className="lg:col-span-2">
          <div className="dashboard-card p-6">
            <h3 className="text-lg font-semibold mb-4">Project Status</h3>
            <ChartContainer
              type="pie"
              data={projectsChartData}
              height={300}
            />
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-card p-6">
        <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
        
        <div className="space-y-4">
          {/* Mock recent activity items */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Video &quot;Marketing Campaign Q4&quot; processed successfully</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
              Completed
            </span>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium">AI clips generated for &quot;Product Demo&quot;</p>
              <p className="text-sm text-gray-500">4 hours ago</p>
            </div>
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
              Processing
            </span>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Generated 50 hashtags for social media campaign</p>
              <p className="text-sm text-gray-500">6 hours ago</p>
            </div>
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full">
              Completed
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button className="dashboard-btn btn-primary px-6 py-2 rounded-lg font-medium">
            View All Activity
          </button>
        </div>
      </section>
    </div>
  );
}
