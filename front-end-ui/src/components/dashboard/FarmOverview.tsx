import React, { useState } from 'react';

const FarmOverview: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('satellite');

  const handleViewChange = (viewType: string) => {
    setActiveView(viewType);
    console.log(`Switched to ${viewType} view`);
    // Add your view switching logic here
  };

  const handleFullscreen = () => {
    console.log('Fullscreen button clicked');
    // Add your fullscreen logic here
  };

  return (
    <div className="w-full max-w-[1232px] bg-white rounded-lg border border-[#E5E7EB] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10),0px_4px_6px_0px_rgba(0,0,0,0.10)] relative">
      {/* Header with Title and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:px-4 lg:pt-[9px] gap-4">
        {/* Farm Overview Title */}
        <h2 className="text-[#1F2937] font-semibold text-lg lg:text-xl leading-6 lg:leading-7">
          Farm Overview
        </h2>

        {/* Control Buttons Container */}
        <div className="flex flex-wrap gap-2 lg:gap-2">
          {/* Map Button */}
          <button
            onClick={() => handleViewChange('map')}
            className={`flex items-center justify-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm min-w-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeView === 'map'
                ? 'bg-[#004AB3] text-white'
                : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] active:scale-95'
            }`}
            aria-label="Map view"
          >
            <svg
              width="15"
              height="13"
              viewBox="0 0 17 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M10.8906 13.7683L5.64062 12.2671V1.73156L10.8906 3.23274V13.7683ZM11.7656 13.7355V3.16711L15.241 1.77531C15.673 1.60305 16.1406 1.92024 16.1406 2.38508V11.5398C16.1406 11.8077 15.9766 12.0484 15.7277 12.1495L11.7656 13.7327V13.7355ZM0.803516 3.35031L4.76562 1.76711V12.3327L1.29023 13.7245C0.858203 13.8968 0.390625 13.5796 0.390625 13.1148V3.96008C0.390625 3.69211 0.554688 3.45149 0.803516 3.35031Z"
                fill="currentColor"
              />
            </svg>
            <span className="hidden sm:inline">Map</span>
          </button>

          {/* Layers Button */}
          <button
            onClick={() => handleViewChange('layers')}
            className={`flex items-center justify-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm min-w-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeView === 'layers'
                ? 'bg-[#004AB3] text-white'
                : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] active:scale-95'
            }`}
            aria-label="Layers view"
          >
            <svg
              width="15"
              height="13"
              viewBox="0 0 17 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M8.04492 0.892236C8.45234 0.703564 8.92266 0.703564 9.33008 0.892236L15.3074 3.65395C15.5398 3.7606 15.6875 3.99302 15.6875 4.25005C15.6875 4.50708 15.5398 4.7395 15.3074 4.84614L9.33008 7.60786C8.92266 7.79653 8.45234 7.79653 8.04492 7.60786L2.06758 4.84614C1.83516 4.73677 1.6875 4.50435 1.6875 4.25005C1.6875 3.99575 1.83516 3.7606 2.06758 3.65395L8.04492 0.892236ZM13.8527 6.4813L15.3074 7.15395C15.5398 7.2606 15.6875 7.49302 15.6875 7.75005C15.6875 8.00708 15.5398 8.2395 15.3074 8.34614L9.33008 11.1079C8.92266 11.2965 8.45234 11.2965 8.04492 11.1079L2.06758 8.34614C1.83516 8.23677 1.6875 8.00435 1.6875 7.75005C1.6875 7.49575 1.83516 7.2606 2.06758 7.15395L3.52227 6.4813L7.67852 8.40083C8.31836 8.69614 9.05664 8.69614 9.69648 8.40083L13.8527 6.4813ZM9.69648 11.9008L13.8527 9.9813L15.3074 10.654C15.5398 10.7606 15.6875 10.993 15.6875 11.25C15.6875 11.5071 15.5398 11.7395 15.3074 11.8461L9.33008 14.6079C8.92266 14.7965 8.45234 14.7965 8.04492 14.6079L2.06758 11.8461C1.83516 11.7368 1.6875 11.5043 1.6875 11.25C1.6875 10.9958 1.83516 10.7606 2.06758 10.654L3.52227 9.9813L7.67852 11.9008C8.31836 12.1961 9.05664 12.1961 9.69648 11.9008Z"
                fill="currentColor"
              />
            </svg>
            <span className="hidden sm:inline">Layers</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={handleFullscreen}
            className="flex items-center justify-center gap-1 px-2 lg:px-3 py-1 bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] active:scale-95 rounded text-xs lg:text-sm min-w-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle fullscreen"
          >
            <svg
              width="11"
              height="13"
              viewBox="0 0 13 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M0.875 1.625C0.391016 1.625 0 2.01602 0 2.5V5.125C0 5.60898 0.391016 6 0.875 6C1.35898 6 1.75 5.60898 1.75 5.125V3.375H3.5C3.98398 3.375 4.375 2.98398 4.375 2.5C4.375 2.01602 3.98398 1.625 3.5 1.625H0.875ZM1.75 10.375C1.75 9.89102 1.35898 9.5 0.875 9.5C0.391016 9.5 0 9.89102 0 10.375V13C0 13.484 0.391016 13.875 0.875 13.875H3.5C3.98398 13.875 4.375 13.484 4.375 13C4.375 12.516 3.98398 12.125 3.5 12.125H1.75V10.375ZM8.75 1.625C8.26602 1.625 7.875 2.01602 7.875 2.5C7.875 2.98398 8.26602 3.375 8.75 3.375H10.5V5.125C10.5 5.60898 10.891 6 11.375 6C11.859 6 12.25 5.60898 12.25 5.125V2.5C12.25 2.01602 11.859 1.625 11.375 1.625H8.75ZM12.25 10.375C12.25 9.89102 11.859 9.5 11.375 9.5C10.891 9.5 10.5 9.89102 10.5 10.375V12.125H8.75C8.26602 12.125 7.875 12.516 7.875 13C7.875 13.484 8.26602 13.875 8.75 13.875H11.375C11.859 13.875 12.25 13.484 12.25 13V10.375Z"
                fill="currentColor"
              />
            </svg>
            <span className="hidden lg:inline">Fullscreen</span>
          </button>

          {/* Satellite Button */}
          <button
            onClick={() => handleViewChange('satellite')}
            className={`flex items-center justify-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm min-w-0 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeView === 'satellite'
                ? 'bg-[#004AB3] text-white'
                : 'bg-[#E5E7EB] text-[#374151] hover:bg-[#D1D5DB] active:scale-95'
            }`}
            aria-label="Satellite view"
          >
            <svg
              width="12"
              height="13"
              viewBox="0 0 14 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M5.25 1.625C5.25 1.14102 5.64102 0.75 6.125 0.75C10.4754 0.75 14 4.27461 14 8.625C14 9.10898 13.609 9.5 13.125 9.5C12.641 9.5 12.25 9.10898 12.25 8.625C12.25 5.24258 9.50742 2.5 6.125 2.5C5.64102 2.5 5.25 2.10898 5.25 1.625ZM1.65703 6.78203L4.50352 9.62852L5.28008 8.85195C5.26094 8.78086 5.25 8.7043 5.25 8.625C5.25 8.14102 5.64102 7.75 6.125 7.75C6.60898 7.75 7 8.14102 7 8.625C7 9.10898 6.60898 9.5 6.125 9.5C6.0457 9.5 5.97187 9.48906 5.89805 9.46992L5.12148 10.2465L7.96797 13.093C8.36445 13.4895 8.29063 14.1539 7.76836 14.359C7.12305 14.6105 6.42305 14.75 5.6875 14.75C2.5457 14.75 0 12.2043 0 9.0625C0 8.32695 0.139453 7.62695 0.39375 6.98164C0.598828 6.46211 1.26328 6.38555 1.65977 6.78203H1.65703ZM6.125 3.375C9.02344 3.375 11.375 5.72656 11.375 8.625C11.375 9.10898 10.984 9.5 10.5 9.5C10.016 9.5 9.625 9.10898 9.625 8.625C9.625 6.6918 8.0582 5.125 6.125 5.125C5.64102 5.125 5.25 4.73398 5.25 4.25C5.25 3.76602 5.64102 3.375 6.125 3.375Z"
                fill="currentColor"
              />
            </svg>
            <span className="hidden sm:inline">Satellite</span>
          </button>
        </div>
      </div>

      {/* Map Image Container */}
      <div className="relative w-full rounded-lg border border-[#E5E7EB] overflow-hidden" style={{ aspectRatio: '2.4/1', minHeight: '300px' }}>
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/5f085d303abc5d6ae2fa25cae4e789242856ac8d?width=2410"
          alt="Farm Overview Map"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
    </div>
  );
};

export default FarmOverview;
