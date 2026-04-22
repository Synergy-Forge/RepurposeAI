'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Play, MoreVertical, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Project } from '@/types/dashboard';
import { trpc } from '@/lib/trpc-client';
import { Skeleton } from '@/components/ui/skeleton';

export function ProjectsPage() {
  const videosQuery = trpc.video.getUserVideos.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (last) => last.nextCursor }
  );

  const allVideos = videosQuery.data?.pages.flatMap((p) => p.videos) ?? [];

  const projects: Project[] = allVideos.map((v) => ({
    id: v.id,
    name: v.title,
    status:
      v.status === 'completed'
        ? 'completed'
        : v.status === 'processing' || v.status === 'uploading'
          ? 'processing'
          : 'draft',
    createdAt: new Date(v.createdAt),
    updatedAt: new Date(v.updatedAt),
    duration: v.duration ?? undefined,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Plus className="w-10 h-10 text-gray-500 dark:text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        Start by uploading your first video to begin creating engaging content with AI-powered tools.
      </p>

      <Link href="/dashboard/upload">
        <button className="dashboard-btn btn-primary px-8 py-3 rounded-lg font-semibold">
          <Plus className="w-5 h-5 inline mr-2" />
          Create Your First Project
        </button>
      </Link>
    </div>
  );

  if (videosQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="dashboard-card">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-input pl-10"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="dashboard-input pl-10 pr-8"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <Link href="/dashboard/upload">
            <button className="dashboard-btn btn-primary px-6 py-2 rounded-lg font-medium">
              <Plus className="w-4 h-4 inline mr-2" />
              New Project
            </button>
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="dashboard-card p-12 text-center">
          <Search className="w-10 h-10 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="dashboard-card overflow-hidden group hover:shadow-lg transition-all">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600">
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-70" />
                </div>

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all" />
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>

                {/* Duration */}
                {project.duration && (
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(project.duration)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>

                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {project.updatedAt.toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link href={`/video/${project.id}`} className="flex-1">
                    <button className="dashboard-btn btn-primary w-full px-4 py-2 rounded text-sm">
                      {project.status === 'completed' ? 'View Clips' : 'Continue'}
                    </button>
                  </Link>

                  <button className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {videosQuery.hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => videosQuery.fetchNextPage()}
            disabled={videosQuery.isFetchingNextPage}
            className="border border-gray-300 dark:border-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {videosQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dashboard-card p-6 text-center">
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
            {projects.filter(p => p.status === 'completed').length}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed Projects</p>
        </div>

        <div className="dashboard-card p-6 text-center">
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {projects.filter(p => p.status === 'processing').length}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
        </div>

        <div className="dashboard-card p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {projects.filter(p => p.status === 'draft').length}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Drafts</p>
        </div>
      </div>
    </div>
  );
}
