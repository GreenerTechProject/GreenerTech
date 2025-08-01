import React, { useState } from 'react';

const DashboardHeader: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleVideoCall = () => {
    console.log('Video call button clicked');
  };

  const handleMapControl = () => {
    console.log('Map control button clicked');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search submitted:', searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleProfileClick = () => {
    console.log('Profile button clicked');
  };

  return (
    <header className="w-full h-[75px] bg-white border-b border-[#E5E7EB] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] relative">
      <div className="flex items-center justify-between h-full px-4 lg:px-20">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/f204ee653615a1fcca6f4f94466f318f9ba86115?width=304"
          alt="Asset 6-100 1"
          className="w-24 h-auto lg:w-[152px] lg:h-[57px]"
        />

        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={handleVideoCall}
            className="flex items-center justify-center p-2 hover:bg-gray-100 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Start video call"
          >
            <svg
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 4C0 2.89688 0.896875 2 2 2H10C11.1031 2 12 2.89688 12 4V12C12 13.1031 11.1031 14 10 14H2C0.896875 14 0 13.1031 0 12V4ZM17.4719 3.11875C17.7969 3.29375 18 3.63125 18 4V12C18 12.3687 17.7969 12.7063 17.4719 12.8813C17.1469 13.0563 16.7531 13.0375 16.4438 12.8313L13.4438 10.8313L13 10.5344V10V6V5.46562L13.4438 5.16875L16.4438 3.16875C16.75 2.96563 17.1437 2.94375 17.4719 3.11875Z"
                fill="#004AB3"
              />
            </svg>
          </button>

          <button
            onClick={handleMapControl}
            className="w-[34px] h-[30px] bg-[#B4CC5F] hover:bg-[#A0B654] active:scale-95 rounded-md relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Map controls"
          >
            <svg
              className="absolute left-[4px] top-[2px]"
              width="27"
              height="24"
              viewBox="0 0 27 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 22.3171L9 19.7437V1.68275L18 4.25619V22.3171ZM19.5 22.2609V4.14369L25.4578 1.75775C26.1984 1.46244 27 2.00619 27 2.80306V18.4968C27 18.9562 26.7188 19.3687 26.2922 19.5421L19.5 22.2562V22.2609ZM0.707813 4.45775L7.5 1.74369V19.8562L1.54219 22.2421C0.801563 22.5374 0 21.9937 0 21.1968V5.50306C0 5.04369 0.28125 4.63119 0.707813 4.45775Z"
                fill="#004AB3"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-32 lg:w-[256px] h-8 lg:h-[42px] pl-8 lg:pl-10 pr-3 bg-white border border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#004AB3] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 rounded-lg text-sm lg:text-base text-gray-900 placeholder-[#ADAEBC] transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform duration-200"
              aria-label="Search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13 6.5C13 7.93437 12.5344 9.25938 11.75 10.3344L15.7063 14.2937C16.0969 14.6844 16.0969 15.3188 15.7063 15.7094C15.3156 16.1 14.6812 16.1 14.2906 15.7094L10.3344 11.75C9.25938 12.5375 7.93437 13 6.5 13C2.90937 13 0 10.0906 0 6.5C0 2.90937 2.90937 0 6.5 0C10.0906 0 13 2.90937 13 6.5ZM6.5 11C7.09095 11 7.67611 10.8836 8.22208 10.6575C8.76804 10.4313 9.26412 10.0998 9.68198 9.68198C10.0998 9.26412 10.4313 8.76804 10.6575 8.22208C10.8836 7.67611 11 7.09095 11 6.5C11 5.90905 10.8836 5.32389 10.6575 4.77792C10.4313 4.23196 10.0998 3.73588 9.68198 3.31802C9.26412 2.90016 8.76804 2.56869 8.22208 2.34254C7.67611 2.1164 7.09095 2 6.5 2C5.90905 2 5.32389 2.1164 4.77792 2.34254C4.23196 2.56869 3.73588 2.90016 3.31802 3.31802C2.90016 3.73588 2.56869 4.23196 2.34254 4.77792C2.1164 5.32389 2 5.90905 2 6.5C2 7.09095 2.1164 7.67611 2.34254 8.22208C2.56869 8.76804 2.90016 9.26412 3.31802 9.68198C3.73588 10.0998 4.23196 10.4313 4.77792 10.6575C5.32389 10.8836 5.90905 11 6.5 11Z"
                  fill="#9CA3AF"
                />
              </svg>
            </button>
          </form>

          <button
            onClick={handleProfileClick}
            className="w-6 h-6 lg:w-8 lg:h-8 bg-[#004AB3] hover:bg-[#0039A6] active:scale-95 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="User profile"
          >
            <svg
              width="12"
              height="13"
              viewBox="0 0 14 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="lg:w-[14px] lg:h-[15px]"
            >
              <path
                d="M7 7.75C7.92826 7.75 8.8185 7.38125 9.47487 6.72487C10.1313 6.0685 10.5 5.17826 10.5 4.25C10.5 3.32174 10.1313 2.4315 9.47487 1.77513C8.8185 1.11875 7.92826 0.75 7 0.75C6.07174 0.75 5.1815 1.11875 4.52513 1.77513C3.86875 2.4315 3.5 3.32174 3.5 4.25C3.5 5.17826 3.86875 6.0685 4.52513 6.72487C5.1815 7.38125 6.07174 7.75 7 7.75ZM5.75039 9.0625C3.05703 9.0625 0.875 11.2445 0.875 13.9379C0.875 14.3863 1.23867 14.75 1.68711 14.75H12.3129C12.7613 14.75 13.125 14.3863 13.125 13.9379C13.125 11.2445 10.943 9.0625 8.24961 9.0625H5.75039Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
