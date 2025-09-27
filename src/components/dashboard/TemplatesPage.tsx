'use client';

import { useState } from 'react';
import { Search, Filter, Star } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import { Template } from '@/types/dashboard';

interface TemplatesPageProps {
  onSelectTemplate?: (template: Template) => void;
}

// Mock templates data - replace with real data
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Social Media Highlight',
    description: 'Perfect for creating engaging social media posts with dynamic text overlays and smooth transitions.',
    tags: ['social', 'dynamic', 'trending', 'short-form'],
    category: 'Social Media',
    isPopular: true,
    thumbnail: '/api/placeholder/400/300',
  },
  {
    id: '2',
    name: 'Product Demo',
    description: 'Professional template for showcasing product features with clean animations and call-to-action elements.',
    tags: ['business', 'professional', 'demo', 'product'],
    category: 'Business',
    isPopular: true,
  },
  {
    id: '3',
    name: 'Educational Content',
    description: 'Designed for tutorials and educational videos with clear sections and information hierarchy.',
    tags: ['education', 'tutorial', 'learning', 'instructional'],
    category: 'Education',
  },
  {
    id: '4',
    name: 'Event Promotion',
    description: 'Eye-catching template for promoting events with countdown timers and event details.',
    tags: ['event', 'promotion', 'marketing', 'countdown'],
    category: 'Marketing',
  },
  {
    id: '5',
    name: 'Behind the Scenes',
    description: 'Casual, authentic style perfect for showing the human side of your brand.',
    tags: ['authentic', 'casual', 'brand', 'storytelling'],
    category: 'Brand',
    isPopular: true,
  },
  {
    id: '6',
    name: 'Testimonial',
    description: 'Showcase customer reviews and testimonials with elegant text animations.',
    tags: ['testimonial', 'review', 'customer', 'trust'],
    category: 'Marketing',
  },
];

const categories = ['All', 'Social Media', 'Business', 'Education', 'Marketing', 'Brand'];

export function TemplatesPage({ onSelectTemplate }: TemplatesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesPopular = !showPopularOnly || template.isPopular;
    
    return matchesSearch && matchesCategory && matchesPopular;
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Video Templates</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Choose from our professionally designed templates to create stunning videos quickly. 
          Each template is optimized for different platforms and use cases.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="dashboard-card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-input pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="dashboard-input pl-10 pr-8 min-w-[160px]"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Popular Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="popular-only"
              checked={showPopularOnly}
              onChange={(e) => setShowPopularOnly(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="popular-only" className="text-sm font-medium cursor-pointer">
              <Star className="w-4 h-4 inline mr-1 text-yellow-500" />
              Popular only
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
        
        {showPopularOnly && (
          <div className="flex items-center text-yellow-600 dark:text-yellow-400 text-sm">
            <Star className="w-4 h-4 mr-1 fill-current" />
            Showing popular templates only
          </div>
        )}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="dashboard-card p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onSelectTemplate}
            />
          ))}
        </div>
      )}

      {/* Popular Templates Section */}
      {!showPopularOnly && searchTerm === '' && selectedCategory === 'All' && (
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              <Star className="w-5 h-5 inline mr-2 text-yellow-500" />
              Most Popular Templates
            </h2>
            <button
              onClick={() => setShowPopularOnly(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium"
            >
              View All Popular →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTemplates
              .filter(template => template.isPopular)
              .slice(0, 3)
              .map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={onSelectTemplate}
                />
              ))}
          </div>
        </div>
      )}

      {/* Template Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.slice(1).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              dashboard-card p-4 text-center hover:shadow-lg transition-all
              ${selectedCategory === category ? 'ring-2 ring-indigo-500' : ''}
            `}
          >
            <div className="text-2xl mb-2">
              {category === 'Social Media' && '📱'}
              {category === 'Business' && '💼'}
              {category === 'Education' && '🎓'}
              {category === 'Marketing' && '📈'}
              {category === 'Brand' && '🏢'}
            </div>
            <h3 className="font-medium text-sm">{category}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {mockTemplates.filter(t => t.category === category).length} templates
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
