'use client';

import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { ChartData } from '@/types/dashboard';

interface ChartContainerProps {
  type: 'bar' | 'pie' | 'line' | 'doughnut';
  data: ChartData;
  options?: Partial<ChartConfiguration['options']>;
  className?: string;
  height?: number;
}

export function ChartContainer({ 
  type, 
  data, 
  options = {}, 
  className = '',
  height = 300 
}: ChartContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Get theme colors
    const getThemeColors = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        tickColor: computedStyle.getPropertyValue('--chart-tick-color').trim(),
        gridColor: computedStyle.getPropertyValue('--chart-grid-color').trim(),
        legendColor: computedStyle.getPropertyValue('--text-primary').trim(),
        mainBg: computedStyle.getPropertyValue('--bg-main').trim(),
      };
    };

    const colors = getThemeColors();

    // Default chart options based on type
    const defaultOptions: Partial<ChartConfiguration['options']> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.legendColor,
            font: {
              family: 'Inter',
              size: 14,
            },
            padding: 20,
          },
        },
      },
    };

    // Type-specific options
    if (type === 'bar') {
      defaultOptions.scales = {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: colors.tickColor,
            font: {
              family: 'Inter',
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
          },
          ticks: {
            color: colors.tickColor,
            font: {
              family: 'Inter',
            },
          },
        },
      };
    } else if (type === 'pie' || type === 'doughnut') {
      defaultOptions.plugins!.legend!.position = 'bottom';
      if (type === 'doughnut') {
        (defaultOptions as { cutout?: string }).cutout = '60%';
      }
    }

    // Merge with user options
    const finalOptions = {
      ...defaultOptions,
      ...options,
    };

    // Create chart
    chartRef.current = new Chart(ctx, {
      type,
      data,
      options: finalOptions,
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  // Update chart colors when theme changes
  useEffect(() => {
    if (!chartRef.current) return;

    const updateChartColors = () => {
      const colors = getThemeColors();
      const chart = chartRef.current!;

      // Update legend colors
      if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = colors.legendColor;
      }

      // Update scale colors for bar charts
      if (type === 'bar' && chart.options.scales) {
        if (chart.options.scales.x?.ticks) {
          chart.options.scales.x.ticks.color = colors.tickColor;
        }
        if (chart.options.scales.y?.ticks) {
          chart.options.scales.y.ticks.color = colors.tickColor;
        }
        if (chart.options.scales.y?.grid) {
          chart.options.scales.y.grid.color = colors.gridColor;
        }
      }

      chart.update();
    };

    const getThemeColors = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      return {
        tickColor: computedStyle.getPropertyValue('--chart-tick-color').trim(),
        gridColor: computedStyle.getPropertyValue('--chart-grid-color').trim(),
        legendColor: computedStyle.getPropertyValue('--text-primary').trim(),
        mainBg: computedStyle.getPropertyValue('--bg-main').trim(),
      };
    };

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateChartColors();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [type]);

  return (
    <div className={`dashboard-card chart-container ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ height: `${height}px` }}
        aria-label="Chart"
        role="img"
      />
    </div>
  );
}
