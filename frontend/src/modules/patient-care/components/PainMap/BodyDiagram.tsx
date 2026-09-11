import React, { useState, useRef } from 'react';

interface BodyDiagramProps {
  onPainMarkerAdd?: (marker: any) => void;
  existingMarkers?: any[];
}

const BodyDiagram: React.FC<BodyDiagramProps> = ({
  onPainMarkerAdd,
  existingMarkers = [],
}) => {
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [painIntensity, setPainIntensity] = useState(5);
  const [painType, setPainType] = useState('sharp');
  const [markers, setMarkers] = useState(existingMarkers);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSvgClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newMarker = {
      bodyView,
      xCoordinate: x,
      yCoordinate: y,
      painIntensity,
      painType,
      createdAt: new Date(),
    };

    const updatedMarkers = [...markers, newMarker];
    setMarkers(updatedMarkers);
    onPainMarkerAdd?.(newMarker);
  };

  const getPainColor = (intensity: number): string => {
    // Color gradient from green (0) to red (10)
    if (intensity <= 2) return '#10B981'; // Green
    if (intensity <= 4) return '#F59E0B'; // Yellow
    if (intensity <= 6) return '#F97316'; // Orange
    if (intensity <= 8) return '#EF4444'; // Red
    return '#DC2626'; // Dark Red
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Body View Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عرض الجسم
          </label>
          <div className="flex rounded-md border border-gray-300">
            <button
              type="button"
              onClick={() => setBodyView('front')}
              className={`flex-1 py-2 text-sm font-medium ${
                bodyView === 'front'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              أمامي
            </button>
            <button
              type="button"
              onClick={() => setBodyView('back')}
              className={`flex-1 py-2 text-sm font-medium ${
                bodyView === 'back'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              خلفي
            </button>
          </div>
        </div>

        {/* Pain Intensity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شدة الألم: {painIntensity}/10
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={painIntensity}
            onChange={(e) => setPainIntensity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 (لا ألم)</span>
            <span>10 (أقصى ألم)</span>
          </div>
        </div>

        {/* Pain Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نوع الألم
          </label>
          <select
            value={painType}
            onChange={(e) => setPainType(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="sharp">حاد</option>
            <option value="dull">خفيف</option>
            <option value="burning">حارق</option>
            <option value="throbbing">نابض</option>
            <option value="stabbing">طاعن</option>
            <option value="numbness">تنميل</option>
            <option value="tingling">وخز</option>
          </select>
        </div>
      </div>

      {/* Body Diagram */}
      <div className="relative bg-gray-50 rounded-lg p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 200 400"
          className="w-full max-w-md mx-auto cursor-pointer"
          onClick={handleSvgClick}
        >
          {/* Body Outline (Simplified) */}
          {bodyView === 'front' ? (
            <>
              {/* Head */}
              <circle cx="100" cy="30" r="20" fill="none" stroke="#9CA3AF" strokeWidth="2" />
              {/* Neck */}
              <line x1="95" y1="50" x2="95" y2="60" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="105" y1="50" x2="105" y2="60" stroke="#9CA3AF" strokeWidth="2" />
              {/* Torso */}
              <ellipse cx="100" cy="130" rx="35" ry="70" fill="none" stroke="#9CA3AF" strokeWidth="2" />
              {/* Arms */}
              <line x1="65" y1="80" x2="35" y2="160" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="135" y1="80" x2="165" y2="160" stroke="#9CA3AF" strokeWidth="2" />
              {/* Legs */}
              <line x1="85" y1="200" x2="75" y2="350" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="115" y1="200" x2="125" y2="350" stroke="#9CA3AF" strokeWidth="2" />
            </>
          ) : (
            <>
              {/* Back view (simplified) */}
              <circle cx="100" cy="30" r="20" fill="none" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="95" y1="50" x2="95" y2="60" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="105" y1="50" x2="105" y2="60" stroke="#9CA3AF" strokeWidth="2" />
              <ellipse cx="100" cy="130" rx="35" ry="70" fill="none" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="65" y1="80" x2="35" y2="160" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="135" y1="80" x2="165" y2="160" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="85" y1="200" x2="75" y2="350" stroke="#9CA3AF" strokeWidth="2" />
              <line x1="115" y1="200" x2="125" y2="350" stroke="#9CA3AF" strokeWidth="2" />
              {/* Spine */}
              <line x1="100" y1="60" x2="100" y2="200" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="5,5" />
            </>
          )}

          {/* Pain Markers */}
          {markers
            .filter((marker: any) => marker.bodyView === bodyView)
            .map((marker: any, index: number) => (
              <g key={index}>
                <circle
                  cx={(marker.xCoordinate / 100) * 200}
                  cy={(marker.yCoordinate / 100) * 400}
                  r="8"
                  fill={getPainColor(marker.painIntensity)}
                  opacity="0.7"
                />
                <text
                  x={(marker.xCoordinate / 100) * 200}
                  y={(marker.yCoordinate / 100) * 400 + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fill="white"
                  fontWeight="bold"
                >
                  {marker.painIntensity}
                </text>
              </g>
            ))}
        </svg>

        <p className="text-center text-sm text-gray-500 mt-4">
          اضغط على الرسم التخطيطي لإضافة موقع الألم
        </p>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-4 space-x-reverse text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 ms-1"></div>
          <span>0-2 (خفيف)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 ms-1"></div>
          <span>3-4 (متوسط)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 ms-1"></div>
          <span>5-6 (شديد)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 ms-1"></div>
          <span>7-8 (شديد جداً)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-700 ms-1"></div>
          <span>9-10 (لا يُطاق)</span>
        </div>
      </div>
    </div>
  );
};

export default BodyDiagram;
