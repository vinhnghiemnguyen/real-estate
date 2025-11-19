
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
      <div className="flex justify-between items-baseline border-b border-gray-100 last:border-0">
        <p className="text-sm font-semibold text-gray-600 whitespace-nowrap pr-2 leading-tight">{label}</p>
        <p className="text-sm text-gray-900 text-right font-medium max-w-[350px] break-words leading-tight">{stringValue}</p>
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
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-300 pb-0.5 mb-0.5 leading-tight">{project.name}</h3>
          <div className="text-gray-700">
            {renderInfo('Chủ đầu tư', project.investor)}
            {renderInfo('Loại hình', project.category)}
            {renderInfo('Vị trí', location)}
            
            {/* Scale Information */}
            <div className="bg-gray-50 p-1 rounded my-0.5 border border-gray-200">
                <p className="text-sm font-bold text-gray-700 border-b border-gray-200 mb-0.5 leading-none">Quy mô & Pháp lý</p>
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

          <div className="mt-1 grid grid-cols-2 gap-2">
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="text-center text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold text-sm py-1 px-2 rounded-md transition-colors leading-tight">
              View Project
            </a>
            <a 
              href={googleMapsUrl}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-center text-green-600 bg-green-50 hover:bg-green-100 font-semibold text-sm py-1 px-2 rounded-md transition-colors leading-tight"
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
