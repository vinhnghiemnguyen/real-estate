
import React, { useState, useRef } from 'react';
import type { Project } from '../types';

interface FilterPanelProps {
  provinces: string[];
  districts: string[];
  investors: { name: string; count: number }[];
  selectedProvince: string;
  selectedDistrict: string;
  selectedInvestor: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onInvestorChange: (value: string) => void;
  resultCount: number;
  filteredProjects: Project[];
  allProjects: Project[];
  onFileUpload: (file: File) => void;
  uploadError: string | null;
  showLabels: boolean;
  onShowLabelsChange: (value: boolean) => void;
  minProjectsCount: number;
  onMinProjectsCountChange: (value: number) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  investorSearchQuery: string;
  onInvestorSearchChange: (value: string) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  provinces,
  districts,
  investors,
  selectedProvince,
  selectedDistrict,
  selectedInvestor,
  onProvinceChange,
  onDistrictChange,
  onInvestorChange,
  resultCount,
  filteredProjects,
  allProjects,
  onFileUpload,
  uploadError,
  showLabels,
  onShowLabelsChange,
  minProjectsCount,
  onMinProjectsCountChange,
  searchQuery,
  onSearchChange,
  investorSearchQuery,
  onInvestorSearchChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset file input to allow re-uploading the same file name
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportJson = () => {
    if (resultCount === 0) return;

    const dataStr = JSON.stringify(filteredProjects, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'projects.json';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const FilterSelect: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[], disabled?: boolean, placeholder: string}> = 
  ({ label, value, onChange, options, disabled = false, placeholder }) => (
    <div className="mb-4">
      <label className="block text-gray-300 text-sm font-bold mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="block appearance-none w-full bg-gray-700 border border-gray-600 text-white py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-gray-600 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="All">{placeholder}</option>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
     <div className="p-4 bg-gray-800 text-white w-full h-full overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-300">Project Finder</h2>
        </div>
        
        {/* Project Name Search Input */}
        <div className="mb-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out"
                    placeholder="Search projects by name..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Search projects"
                />
            </div>
        </div>
        
        <div className="mb-4 pb-4 border-b border-gray-700">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv,.json"
            />
            <button
                onClick={handleUploadClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
                aria-label="Upload project data file"
            >
                Upload Project Data
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
                Upload a .csv or .json file to update the map.
            </p>
            {uploadError && (
                <p className="text-sm text-red-400 mt-2 text-center font-semibold" role="alert">{uploadError}</p>
            )}
        </div>

        <div className="flex-grow">
          <FilterSelect
            label="Province / City"
            value={selectedProvince}
            onChange={(e) => onProvinceChange(e.target.value)}
            options={provinces.map(p => ({value: p, label: p}))}
            placeholder="All Provinces"
          />

          <FilterSelect
            label="District"
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            options={districts.map(d => ({value: d, label: d}))}
            disabled={selectedProvince === 'All'}
            placeholder="All Districts"
          />

           {/* Investor Name Search Input */}
           <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2">Search Investor</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-9 pr-3 py-2 border border-gray-600 rounded leading-tight bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-gray-600 focus:border-blue-500 sm:text-sm"
                        placeholder="Type investor name..."
                        value={investorSearchQuery}
                        onChange={(e) => onInvestorSearchChange(e.target.value)}
                    />
                </div>
           </div>

          <div className="mb-4">
            <label htmlFor="min-projects-input" className="block text-gray-300 text-sm font-bold mb-2">Minimum Projects</label>
            <input
              id="min-projects-input"
              type="number"
              value={minProjectsCount}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                onMinProjectsCountChange(isNaN(value) || value < 0 ? 0 : value);
              }}
              min="0"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 px-3 rounded leading-tight focus:outline-none focus:bg-gray-600 focus:border-blue-500"
              aria-label="Minimum projects by investor"
            />
          </div>

          <FilterSelect
            label="Investor (Dropdown)"
            value={selectedInvestor}
            onChange={(e) => onInvestorChange(e.target.value)}
            options={investors.map(i => ({ value: i.name, label: `${i.name} (${i.count})` }))}
            placeholder="All Investors"
          />
        </div>
        
        <div className="space-y-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
                <label htmlFor="show-labels-toggle" className="text-gray-300 text-sm font-bold cursor-pointer select-none">
                    Show Project Names
                </label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input 
                        type="checkbox" 
                        name="toggle" 
                        id="show-labels-toggle" 
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        checked={showLabels}
                        onChange={(e) => onShowLabelsChange(e.target.checked)}
                    />
                    <label htmlFor="show-labels-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-gray-300">
                  Found <span className="font-bold text-blue-400">{resultCount}</span> projects.
              </p>
              <div className="w-full">
                <button
                  onClick={handleExportJson}
                  disabled={resultCount === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Export filtered projects to JSON"
                >
                  Export to JSON
                </button>
              </div>
            </div>
        </div>
      </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden p-3 bg-gray-900 text-white flex justify-between items-center z-20 shadow-lg">
        <h1 className="text-xl font-bold">Project Filters</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-expanded={isOpen} aria-controls="mobile-filter-panel">
          <span className="sr-only">{isOpen ? 'Close filters' : 'Open filters'}</span>
          <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      <div id="mobile-filter-panel" className={`fixed inset-0 z-10 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
         {renderFilters()}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block md:w-80 lg:w-96 flex-shrink-0 h-screen">
        {renderFilters()}
      </aside>
    </>
  );
};

export default FilterPanel;
