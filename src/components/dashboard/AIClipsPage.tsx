'use client';

import { useState } from 'react';
import { Sparkles, Clock, Users, Target } from 'lucide-react';
import { AIClipFinderParams } from '@/types/dashboard';

interface AIClipsPageProps {
  onStartFinder?: (params: AIClipFinderParams) => void;
}

export function AIClipsPage({ onStartFinder }: AIClipsPageProps) {
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [clipLength, setClipLength] = useState<number>(30);
  const [audience, setAudience] = useState<AIClipFinderParams['audience']>('general');
  const [platform, setPlatform] = useState<AIClipFinderParams['platform']>('youtube');

  const handleStartFinder = () => {
    if (!selectedVideo) return;

    const params: AIClipFinderParams = {
      videoId: selectedVideo,
      clipLength,
      audience,
      platform,
    };

    onStartFinder?.(params);
  };

  // Mock video options - replace with real data
  const videoOptions = [
    { id: '1', name: 'Marketing Campaign Q4 - Full Video', duration: '15:30' },
    { id: '2', name: 'Product Demo Walkthrough', duration: '8:45' },
    { id: '3', name: 'Customer Success Stories', duration: '12:20' },
    { id: '4', name: 'Company Culture Video', duration: '6:15' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          <span className="gradient-text">AI Clip Finder</span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Let our AI identify the most engaging moments in your videos and automatically create 
          short-form content optimized for your target audience and platform.
        </p>
      </div>

      {/* Configuration Form */}
      <div className="dashboard-card p-8 mb-8">
        <h2 className="text-xl font-semibold mb-6">Configure Your AI Clip Finder</h2>
        
        <div className="space-y-6">
          {/* Video Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Select Video</label>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="dashboard-input"
            >
              <option value="">Choose a video to analyze...</option>
              {videoOptions.map(video => (
                <option key={video.id} value={video.id}>
                  {video.name} ({video.duration})
                </option>
              ))}
            </select>
          </div>

          {/* Grid for other options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Clip Length */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Clip Length
              </label>
              <select
                value={clipLength}
                onChange={(e) => setClipLength(Number(e.target.value))}
                className="dashboard-input"
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={90}>1.5 minutes</option>
                <option value={120}>2 minutes</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <Users className="w-4 h-4 inline mr-2" />
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as AIClipFinderParams['audience'])}
                className="dashboard-input"
              >
                <option value="general">General</option>
                <option value="business">Business</option>
                <option value="educational">Educational</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <Target className="w-4 h-4 inline mr-2" />
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as AIClipFinderParams['platform'])}
                className="dashboard-input"
              >
                <option value="youtube">YouTube Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4">
            <button
              onClick={handleStartFinder}
              disabled={!selectedVideo}
              className="dashboard-btn btn-primary px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              Start AI Analysis
            </button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="dashboard-card p-8">
        <h2 className="text-xl font-semibold mb-6">How AI Clip Finder Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="font-semibold mb-2">Analyze Content</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Our AI analyzes your video content, identifying key moments, emotional peaks, and engaging segments.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✂️</span>
            </div>
            <h3 className="font-semibold mb-2">Smart Extraction</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically extract the most compelling clips based on your audience and platform preferences.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-semibold mb-2">Optimize & Export</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get platform-optimized clips with captions, hashtags, and optimal formatting for maximum engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
