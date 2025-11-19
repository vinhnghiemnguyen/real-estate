
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Project } from './types';
import MapDisplay from './components/MapDisplay';
import FilterPanel from './components/FilterPanel';
import { projectData } from './constants';

// Add PapaParse to the global window interface for TypeScript
declare global {
  interface Window {
    Papa: any;
    __PRELOADED_PROJECTS__?: Project[];
  }
}

/**
 * Dynamically loads the PapaParse script from a CDN.
 * @returns A promise that resolves when the script is loaded, or rejects on error.
 */
const loadPapaParse = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Papa) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/papaparse@5.4.1/papaparse.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PapaParse library.'));
    document.body.appendChild(script);
  });
};

/**
 * robust data transformation function that handles various input formats (CSV, old JSON, new Vietnamese JSON)
 */
const transformItemToProject = (item: any): Project => {
  let attributes = item.attributes || {};
  
  // Handle "Attributes (Other)" column which might be a JSON string or object
  const rawAttributes = item['Attributes (Other)'];
  if (rawAttributes) {
      if (typeof rawAttributes === 'string' && rawAttributes.trim().startsWith('{')) {
          try {
              attributes = { ...attributes, ...JSON.parse(rawAttributes) };
          } catch (e) {
              console.warn("Failed to parse attributes JSON:", rawAttributes);
          }
      } else if (typeof rawAttributes === 'object') {
           attributes = { ...attributes, ...rawAttributes };
      }
  }

  // Determine coordinates, handling various key names and string/number types
  const lat = parseFloat(item.latitude || item.Latitude || item.lat);
  const lng = parseFloat(item.longitude || item.Longitude || item.long);

  return {
    name: item.name || item['Tên Dự Án'] || 'N/A',
    projectUrl: item.projectUrl || item['URL Dự Án'] || '#',
    province: item.province || item['Cấp 2'] || 'N/A',
    district: item.district || item['Cấp 3'] || 'N/A',
    category: item.category || item['Cấp 4'] || 'N/A',
    latitude: isNaN(lat) ? null : lat,
    longitude: isNaN(lng) ? null : lng,
    area: item.area || item['Diện tích'] || 'N/A',
    units: item.units || item['Số căn'] || 'N/A',
    towers: item.towers || item['Số tòa'] || 'N/A',
    investor: item.investor || item['Chủ đầu tư'] || 'N/A',
    attributes: attributes,
    priceHistory: item.priceHistory || null
  };
};

const App: React.FC = () => {
  // Initialize with fallback data or global data
  const [allProjects, setAllProjects] = useState<Project[]>(() => window.__PRELOADED_PROJECTS__ || projectData);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(allProjects);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedProvince, setSelectedProvince] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedInvestor, setSelectedInvestor] = useState<string>('All');
  const [showLabels, setShowLabels] = useState<boolean>(false);
  // Default minimum projects count set to 0 to allow seeing all investors initially
  const [minProjectsCount, setMinProjectsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [investorSearchQuery, setInvestorSearchQuery] = useState<string>('');

  // Effect to load data.json from public folder on startup
  useEffect(() => {
    const loadExternalData = async () => {
      try {
        // Attempt to fetch 'data.json' from the root/public directory
        const response = await fetch('data.json');
        
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const jsonData = await response.json();
            if (Array.isArray(jsonData)) {
              const mappedProjects = jsonData.map(transformItemToProject);
              setAllProjects(mappedProjects);
              console.log("Loaded data.json successfully");
            }
          }
        }
      } catch (error) {
        // Silently fail and stick to default data if file doesn't exist
        console.log("Could not load external data.json, using default data.");
      }
    };

    loadExternalData();
  }, []);

  const provinces = useMemo(() => {
    return [...new Set(allProjects.map(p => p.province).filter(Boolean))].sort();
  }, [allProjects]);

  const investorsData = useMemo(() => {
    const relevantProjects = allProjects.filter(project => {
      const provinceMatch = selectedProvince === 'All' || project.province === selectedProvince;
      const districtMatch = selectedDistrict === 'All' || project.district === selectedDistrict;
      // Also filter investors based on search query to show relevant counts if search is active?
      // Usually investor list shows investors for current GEOGRAPHIC filter.
      return provinceMatch && districtMatch;
    });

    const investorCounts: Record<string, number> = {};
    relevantProjects.forEach(project => {
      // Normalize investor name to group 'null' or empty as 'N/A'
      const invName = project.investor && project.investor.trim() !== '' ? project.investor : 'N/A';
      investorCounts[invName] = (investorCounts[invName] || 0) + 1;
    });
    
    // Filter based on count and sort alphabetically
    return Object.entries(investorCounts)
      .map(([name, count]) => ({ name, count }))
      .filter(({ count }) => count >= minProjectsCount)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProjects, selectedProvince, selectedDistrict, minProjectsCount]);

  const eligibleInvestorNames = useMemo(() => new Set(investorsData.map(i => i.name)), [investorsData]);

  useEffect(() => {
    // If the selected investor is no longer in the filtered list, reset the selection.
    if (selectedInvestor !== 'All' && !eligibleInvestorNames.has(selectedInvestor)) {
        setSelectedInvestor('All');
    }
  }, [selectedInvestor, eligibleInvestorNames]);


  const availableDistricts = useMemo(() => {
    if (selectedProvince === 'All') {
      return [];
    }
    return [...new Set(allProjects
      .filter(p => p.province === selectedProvince)
      .map(p => p.district)
      .filter(Boolean))
    ].sort();
  }, [selectedProvince, allProjects]);

  useEffect(() => {
    const filtered = allProjects.filter(project => {
      const provinceMatch = selectedProvince === 'All' || project.province === selectedProvince;
      const districtMatch = selectedDistrict === 'All' || project.district === selectedDistrict;
      
      const projectInvestor = project.investor && project.investor.trim() !== '' ? project.investor : 'N/A';
      
      let investorMatch = true;
      if (selectedInvestor !== 'All') {
          investorMatch = projectInvestor === selectedInvestor;
      } else if (minProjectsCount > 0) {
           // For map filtering when "All" investors are selected, we currently show everything.
           investorMatch = true;
      }

      const searchMatch = searchQuery === '' || (project.name && project.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const investorSearchMatch = investorSearchQuery === '' || 
        (projectInvestor.toLowerCase().includes(investorSearchQuery.toLowerCase()));
      
      return provinceMatch && districtMatch && investorMatch && searchMatch && investorSearchMatch;
    });
    setFilteredProjects(filtered);
  }, [selectedProvince, selectedDistrict, selectedInvestor, allProjects, minProjectsCount, searchQuery, investorSearchQuery]);
  
  const resetFilters = () => {
    setSelectedProvince('All');
    setSelectedDistrict('All');
    setSelectedInvestor('All');
    setMinProjectsCount(0);
    setSearchQuery('');
    setInvestorSearchQuery('');
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        let newProjects: Project[] = [];

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content);
          if (!Array.isArray(jsonData)) {
            throw new Error('Invalid JSON format. Expected an array of projects.');
          }
          newProjects = jsonData.map(transformItemToProject);
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          await loadPapaParse();
          const parsed = window.Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
          });
          
          if (parsed.errors.length > 0) {
              console.error('CSV Parsing errors:', parsed.errors);
              throw new Error(`CSV parsing error on row ${parsed.errors[0].row}: ${parsed.errors[0].message}`);
          }
          
          newProjects = parsed.data.map(transformItemToProject);
        } else {
            throw new Error('Unsupported file type. Please upload a .csv or .json file.');
        }

        setAllProjects(newProjects);
        resetFilters();
      } catch (error) {
        console.error('File processing error:', error);
        setUploadError(error instanceof Error ? error.message : 'An unknown error occurred.');
      }
    };
    
    reader.onerror = () => {
        setUploadError('Failed to read the file.');
    };

    reader.readAsText(file);
  };

  const handleProvinceChange = useCallback((province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict('All');
  }, []);

  const handleDistrictChange = useCallback((district: string) => {
    setSelectedDistrict(district);
  }, []);

  const handleInvestorChange = useCallback((investor: string) => {
    setSelectedInvestor(investor);
  }, []);

  const handleShowLabelsChange = useCallback((value: boolean) => {
    setShowLabels(value);
  }, []);
  
  const handleMinProjectsCountChange = useCallback((count: number) => {
      setMinProjectsCount(count);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleInvestorSearchChange = useCallback((query: string) => {
    setInvestorSearchQuery(query);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen font-sans">
      <FilterPanel
        allProjects={allProjects}
        provinces={provinces}
        districts={availableDistricts}
        investors={investorsData}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
        selectedInvestor={selectedInvestor}
        onProvinceChange={handleProvinceChange}
        onDistrictChange={handleDistrictChange}
        onInvestorChange={handleInvestorChange}
        resultCount={filteredProjects.length}
        filteredProjects={filteredProjects}
        onFileUpload={handleFileUpload}
        uploadError={uploadError}
        showLabels={showLabels}
        onShowLabelsChange={handleShowLabelsChange}
        minProjectsCount={minProjectsCount}
        onMinProjectsCountChange={handleMinProjectsCountChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        investorSearchQuery={investorSearchQuery}
        onInvestorSearchChange={handleInvestorSearchChange}
      />
      <main className="flex-1 h-screen md:h-full">
        <MapDisplay projects={filteredProjects} showLabels={showLabels} />
      </main>
    </div>
  );
};

export default App;
