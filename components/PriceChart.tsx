
import React, { useState, useMemo } from 'react';
import type { PriceHistory } from '../types';

interface PriceChartProps {
  data: PriceHistory;
}

const PriceChart: React.FC<PriceChartProps> = ({ data }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { labels, min, max, avg } = data;
  // Increased dimensions for a larger, clearer chart
  const width = 500;
  const height = 300;
  const padding = 30; // Increased padding for larger labels
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate global min and max for Y-axis scaling
  const allValues = [...min, ...max, ...avg].filter(v => v !== null && v !== undefined);
  const minValue = Math.min(...allValues) * 0.9; // 10% padding bottom
  const maxValue = Math.max(...allValues) * 1.1; // 10% padding top
  const range = maxValue - minValue;

  const getX = (index: number) => padding + (index / (labels.length - 1)) * chartWidth;
  const getY = (value: number) => height - padding - ((value - minValue) / range) * chartHeight;

  const createPath = (values: number[]) => {
    return values.map((val, index) => 
      `${index === 0 ? 'M' : 'L'} ${getX(index)},${getY(val)}`
    ).join(' ');
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Use ratio to handle responsive resizing correctly
    // (MouseX relative to Rect) / RectWidth * InternalSVGWidth
    const relativeX = e.clientX - rect.left;
    const svgX = (relativeX / rect.width) * width;
    
    const chartAreaX = svgX - padding;
    const index = Math.round((chartAreaX / chartWidth) * (labels.length - 1));
    
    if (index >= 0 && index < labels.length) {
      setHoverIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const hoverData = hoverIndex !== null ? {
    label: labels[hoverIndex],
    min: min[hoverIndex],
    avg: avg[hoverIndex],
    max: max[hoverIndex]
  } : null;

  return (
    <div className="mt-4 bg-white rounded border border-gray-200 p-2 shadow-sm select-none">
      <h4 className="text-sm font-bold text-gray-600 mb-2 text-center">Price History (Million VND/m²)</h4>
      <div className="relative">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${width} ${height}`} 
          className="overflow-visible block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
             const y = height - padding - t * chartHeight;
             const val = minValue + t * range;
             return (
               <g key={t}>
                 <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                 <text x={padding - 4} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280" fontWeight="500">{val.toFixed(0)}</text>
               </g>
             )
          })}

          {/* Paths */}
          <path d={createPath(max)} fill="none" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.7" />
          <path d={createPath(avg)} fill="none" stroke="#3b82f6" strokeWidth="3" />
          <path d={createPath(min)} fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.7" />

          {/* Hover Line and Points */}
          {hoverIndex !== null && (
            <g>
              <line 
                x1={getX(hoverIndex)} 
                y1={padding} 
                x2={getX(hoverIndex)} 
                y2={height - padding} 
                stroke="#4b5563" 
                strokeWidth="1" 
                strokeDasharray="4"
              />
              <circle cx={getX(hoverIndex)} cy={getY(max[hoverIndex])} r="4" fill="#ef4444" stroke="white" strokeWidth="1"/>
              <circle cx={getX(hoverIndex)} cy={getY(avg[hoverIndex])} r="5" fill="#3b82f6" stroke="white" strokeWidth="1"/>
              <circle cx={getX(hoverIndex)} cy={getY(min[hoverIndex])} r="4" fill="#10b981" stroke="white" strokeWidth="1"/>
            </g>
          )}
        </svg>

        {/* Tooltip */}
        {hoverData && (
          <div className="absolute top-0 left-0 bg-gray-800 text-white text-xs p-2.5 rounded shadow-xl pointer-events-none z-10 opacity-95 min-w-[120px]" style={{
              left: (getX(hoverIndex!) / width) * 100 + '%',
              transform: getX(hoverIndex!) > width / 2 ? 'translateX(-110%)' : 'translateX(10%)',
              top: 10
          }}>
            <div className="font-bold mb-1 border-b border-gray-500 pb-1 text-center">{hoverData.label}</div>
            <div className="flex items-center justify-between gap-4 text-red-300 mb-0.5"><span>Max:</span> <span className="font-mono">{hoverData.max.toFixed(1)}</span></div>
            <div className="flex items-center justify-between gap-4 text-blue-300 font-bold mb-0.5"><span>Avg:</span> <span className="font-mono text-sm">{hoverData.avg.toFixed(1)}</span></div>
            <div className="flex items-center justify-between gap-4 text-green-300"><span>Min:</span> <span className="font-mono">{hoverData.min.toFixed(1)}</span></div>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-2">
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 opacity-80"></span><span className="text-xs font-medium text-gray-600">Max</span></div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-xs font-bold text-gray-700">Average</span></div>
           <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 opacity-80"></span><span className="text-xs font-medium text-gray-600">Min</span></div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
