'use client';

import { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Scissors,
  Type,
  Image as ImageIcon,
  Music,
  Wand2,
  Download,
  Share2
} from 'lucide-react';
import { EditorTool } from '@/types/dashboard';

interface EditorPageProps {
  videoId?: string;
}

const editorTools: EditorTool[] = [
  {
    id: 'cut',
    name: 'Cut & Trim',
    icon: <Scissors className="w-5 h-5" />,
    description: 'Cut and trim video segments with precision',
  },
  {
    id: 'text',
    name: 'Add Text',
    icon: <Type className="w-5 h-5" />,
    description: 'Add captions, titles, and text overlays',
  },
  {
    id: 'overlay',
    name: 'Add Overlay',
    icon: <ImageIcon className="w-5 h-5" />,
    description: 'Add images, logos, and visual elements',
  },
  {
    id: 'audio',
    name: 'Audio Edit',
    icon: <Music className="w-5 h-5" />,
    description: 'Adjust audio levels and add background music',
  },
  {
    id: 'ai-enhance',
    name: 'AI Enhance',
    icon: <Wand2 className="w-5 h-5" />,
    description: 'Auto-enhance video quality and colors',
  },
];

export function EditorPage({ videoId: _videoId }: EditorPageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(180); // 3 minutes
  const [volume, setVolume] = useState(100);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToolSelect = (toolId: string) => {
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  const renderToolPanel = () => {
    const tool = editorTools.find(t => t.id === activeTool);
    if (!tool) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium mb-3">{tool.name}</h4>
        
        {/* Tool-specific controls would go here */}
        {activeTool === 'cut' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="number"
                placeholder="0"
                className="dashboard-input"
                min="0"
                max={duration}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="number"
                placeholder={duration.toString()}
                className="dashboard-input"
                min="0"
                max={duration}
              />
            </div>
            <button className="dashboard-btn btn-primary px-4 py-2 rounded w-full">
              Apply Cut
            </button>
          </div>
        )}

        {activeTool === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Text Content</label>
              <input
                type="text"
                placeholder="Enter your text..."
                className="dashboard-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Font Size</label>
                <select className="dashboard-input">
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                  <option>Extra Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  className="dashboard-input h-10"
                />
              </div>
            </div>
            <button className="dashboard-btn btn-primary px-4 py-2 rounded w-full">
              Add Text
            </button>
          </div>
        )}

        {activeTool === 'overlay' && (
          <div className="space-y-3">
            <button className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center hover:border-indigo-500 transition-colors">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Click to upload image</p>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <select className="dashboard-input">
                  <option>Top Left</option>
                  <option>Top Right</option>
                  <option>Bottom Left</option>
                  <option>Bottom Right</option>
                  <option>Center</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <select className="dashboard-input">
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex gap-4">
      {/* Tools Panel */}
      <div className="w-80 flex-shrink-0 dashboard-card p-4">
        <h2 className="text-lg font-semibold mb-4">Editor Tools</h2>
        
        <div className="space-y-2">
          {editorTools.map((tool) => (
            <div key={tool.id}>
              <button
                onClick={() => handleToolSelect(tool.id)}
                className={`editor-tool ${activeTool === tool.id ? 'active' : ''}`}
              >
                {tool.icon}
                <span>{tool.name}</span>
              </button>
              
              {activeTool === tool.id && (
                <div className="mt-2 ml-8 text-sm text-gray-600 dark:text-gray-400">
                  {tool.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {renderToolPanel()}

        {/* Export Section */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium mb-3">Export Options</h3>
          <div className="space-y-2">
            <button className="dashboard-btn btn-primary w-full px-4 py-2 rounded">
              <Download className="w-4 h-4 inline mr-2" />
              Export Video
            </button>
            <button className="border border-gray-300 dark:border-gray-600 w-full px-4 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Share2 className="w-4 h-4 inline mr-2" />
              Share Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Preview */}
        <div className="dashboard-card p-6 mb-4 flex-1">
          <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center relative">
            {/* Video placeholder */}
            <div className="text-white text-center">
              <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="opacity-70">Video Preview</p>
            </div>
            
            {/* Video overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
            </div>
          </div>

          {/* Video Controls */}
          <div className="space-y-4">
            {/* Timeline */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-mono">{formatTime(currentTime)}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-sm font-mono">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>
              
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 ml-8">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm w-8">{volume}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Editor */}
        <div className="dashboard-card p-4">
          <h3 className="font-medium mb-3">Timeline</h3>
          
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[120px]">
            {/* Timeline tracks would go here */}
            <div className="space-y-2">
              {/* Video Track */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium w-16">Video</span>
                <div className="flex-1 bg-blue-500 h-8 rounded relative">
                  <div className="absolute inset-0 flex items-center px-2 text-white text-xs">
                    Video Track
                  </div>
                </div>
              </div>
              
              {/* Audio Track */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium w-16">Audio</span>
                <div className="flex-1 bg-green-500 h-6 rounded relative">
                  <div className="absolute inset-0 flex items-center px-2 text-white text-xs">
                    Audio Track
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
