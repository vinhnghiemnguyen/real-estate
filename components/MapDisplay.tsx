
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import type { Map } from 'leaflet';
import type { Project } from '../types';
import PriceChart from './PriceChart';

interface MapDisplayProps {
  projects: Project[];
  showLabels: boolean;
}

const ProjectMarker: React.FC<{project: Project, showLabels: boolean}> = ({ project, showLabels }) => {
  if (!project.latitude || !project.longitude) return null;

  const googleMapsUrl = `https://www.google.com/maps?q=${project.latitude},${project.longitude}`;
  
  const renderInfo = (label: string, value: any) => {
    if (value == null) return null;
    const stringValue = String(value);
    if (stringValue === 'N/A' || stringValue.trim() === '') return null;
    return (
      <div className="flex justify-between items-start py-0.5 border-b border-gray-100 last:border-0">
        <p className="text-sm font-semibold text-gray-600 whitespace-nowrap pr-2">{label}</p>
        <p className="text-sm text-gray-900 text-right font-medium max-w-[300px] break-words">{stringValue}</p>
      </div>
    );
  };

  const location = [project.district, project.province].filter(p => p && p !== 'N/A').join(', ');

  // Extract legal status if available, checking common keys
  const legalStatus = project.attributes['Pháp lý'] || project.attributes['Legal'] || project.attributes['legal'];

  return (
    <Marker position={[project.latitude, project.longitude]}>
      <Popup maxWidth={600} minWidth={400}>
        <div className="w-full font-sans">
          <h3 className="font-bold text-lg mb-2 text-gray-900 border-b pb-2">{project.name}</h3>
          <div className="space-y-0 text-gray-700 mb-3">
            {renderInfo('Chủ đầu tư', project.investor)}
            {renderInfo('Loại hình', project.category)}
            {renderInfo('Vị trí', location)}
            
            {/* Scale Information */}
            <div className="bg-gray-50 p-2 rounded mt-2 mb-2 border border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-1 border-b border-gray-200 pb-1">Quy mô & Pháp lý</p>
                {renderInfo('Diện tích', project.area)}
                {renderInfo('Số căn', project.units)}
                {renderInfo('Số tòa', project.towers)}
                {renderInfo('Pháp lý', legalStatus)}
            </div>

            {/* Other Attributes */}
            {Object.entries(project.attributes).map(([key, value]) => {
               if (['Pháp lý', 'Legal', 'legal'].includes(key)) return null; // Skip already rendered
               return renderInfo(key, value);
            })}
          </div>
          
          {project.priceHistory && (
             <PriceChart data={project.priceHistory} />
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="text-center text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold text-sm py-2 px-2 rounded-md transition-colors">
              View Project
            </a>
            <a 
              href={googleMapsUrl}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-center text-green-600 bg-green-50 hover:bg-green-100 font-semibold text-sm py-2 px-2 rounded-md transition-colors"
            >
              Google Map
            </a>
          </div>
        </div>
      </Popup>
      {showLabels && (
        <Tooltip direction="right" offset={[10, 0]} permanent>
          {project.name}
        </Tooltip>
      )}
    </Marker>
  );
};

const MapUpdater: React.FC<{projects: Project[]}> = ({ projects }) => {
  const map = useMap();
  useEffect(() => {
    if (projects.length > 0) {
      const validProjects = projects.filter(p => p.latitude && p.longitude);
      if (validProjects.length > 0) {
        const latitudes = validProjects.map(p => p.latitude as number);
        const longitudes = validProjects.map(p => p.longitude as number);
        const bounds: [[number, number], [number, number]] = [
          [Math.min(...latitudes), Math.min(...longitudes)],
          [Math.max(...latitudes), Math.max(...longitudes)]
        ];
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
        map.setView([16.047079, 108.206230], 6); // Default to Da Nang, Vietnam
    }
  }, [projects, map]);

  return null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ projects, showLabels }) => {
  const mapRef = useRef<Map>(null);
  
  // Default center of Vietnam
  const defaultCenter: [number, number] = [16.047079, 108.206230];

  return (
    <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={true} ref={mapRef} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {projects.map((project, index) => (
        <ProjectMarker key={`${project.name}-${index}`} project={project} showLabels={showLabels} />
      ))}
      <MapUpdater projects={projects} />
    </MapContainer>
  );
};

export default MapDisplay;
