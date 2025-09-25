'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Play, FileVideo, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { UploadProgress } from '@/types/dashboard';

interface UploadPageProps {
  onUpload?: (files: File[]) => void;
}

export function UploadPage({ onUpload }: UploadPageProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [dragActive, _setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
    onUpload?.(acceptedFiles);

    // Simulate upload progress
    newUploads.forEach((upload, _index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          setUploadQueue(prev => 
            prev.map(item => 
              item.file === upload.file 
                ? { ...item, progress: 100, status: 'completed' }
                : item
            )
          );
          clearInterval(interval);
        } else {
          setUploadQueue(prev => 
            prev.map(item => 
              item.file === upload.file 
                ? { ...item, progress: Math.round(progress) }
                : item
            )
          );
        }
      }, 300);
    });
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    },
    multiple: true,
  });

  const removeFromQueue = (fileToRemove: File) => {
    setUploadQueue(prev => prev.filter(item => item.file !== fileToRemove));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const _formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <section className="dashboard-card">
        <div
          {...getRootProps()}
          className={`
            upload-dropzone p-12 cursor-pointer transition-all
            ${isDragActive || dragActive ? 'dragover' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop your videos here' : 'Upload your videos'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop your video files here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports MP4, MOV, AVI, MKV, WEBM • Max file size: 2GB
              </p>
            </div>

            <button className="dashboard-btn btn-primary px-8 py-3 rounded-lg font-semibold">
              Select Files
            </button>
          </div>
        </div>
      </section>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <section className="dashboard-card p-6">
          <h3 className="text-lg font-semibold mb-6">Upload Queue</h3>
          
          <div className="space-y-4">
            {uploadQueue.map((upload, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  {/* File Icon */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileVideo className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate pr-4">{upload.file.name}</h4>
                      <div className="flex items-center space-x-2">
                        {upload.status === 'completed' && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                        <button
                          onClick={() => removeFromQueue(upload.file)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span>{formatFileSize(upload.file.size)}</span>
                      <span>Video</span>
                      {upload.status === 'completed' && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Upload Complete
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {upload.status !== 'completed' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{upload.status === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                          <span>{upload.progress}%</span>
                        </div>
                        <Progress value={upload.progress} className="h-2" />
                      </div>
                    )}

                    {/* Action Buttons */}
                    {upload.status === 'completed' && (
                      <div className="flex space-x-3 mt-3">
                        <button className="dashboard-btn btn-primary px-4 py-2 rounded text-sm">
                          Process Video
                        </button>
                        <button className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Play className="w-4 h-4 inline mr-1" />
                          Preview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Batch Actions */}
          {uploadQueue.some(upload => upload.status === 'completed') && (
            <div className="mt-6 flex space-x-3">
              <button className="dashboard-btn btn-primary px-6 py-2 rounded-lg font-medium">
                Process All Videos
              </button>
              <button className="border border-gray-300 dark:border-gray-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Clear Completed
              </button>
            </div>
          )}
        </section>
      )}

      {/* Upload Tips */}
      <section className="dashboard-card p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Tips</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">📹 Video Quality</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Upload in the highest quality available</li>
              <li>• Minimum resolution: 720p recommended</li>
              <li>• Clear audio quality improves transcription</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-indigo-600 dark:text-indigo-400">⚡ Processing</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Processing time depends on video length</li>
              <li>• You&apos;ll be notified when complete</li>
              <li>• Multiple videos can be processed simultaneously</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
