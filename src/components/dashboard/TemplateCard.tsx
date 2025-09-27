'use client';

import Image from 'next/image';
import { Template } from '@/types/dashboard';

interface TemplateCardProps {
  template: Template;
  onSelect?: (template: Template) => void;
}

export function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <div 
      className="template-card dashboard-card p-0 cursor-pointer overflow-hidden group"
      onClick={() => onSelect?.(template)}
      data-tags={template.tags.join(' ')}
    >
      {/* Template Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-indigo-500 to-purple-600">
        {template.thumbnail ? (
          <Image
            src={template.thumbnail}
            alt={template.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-4xl opacity-50">📹</div>
          </div>
        )}
        
        {template.isPopular && (
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Popular
            </span>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {template.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-gray-500 text-xs px-2 py-1">
              +{template.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            {template.category}
          </span>
          
          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors">
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}
