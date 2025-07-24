import React from 'react';
import DashboardHeader from './DashboardHeader';
import ToggleSideNavigation from './ToggleSideNavigation';
import FarmOverview from './FarmOverview';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-white w-full min-h-screen">
      <div className="bg-white w-full max-w-[1440px] mx-auto relative">
        {/* Dashboard Header */}
        <DashboardHeader />

        {/* Mobile/Desktop Layout */}
        <div className="flex flex-col lg:flex-row lg:relative">

          {/* Main Content */}
          <div className="w-full px-4 pt-4 lg:pl-[104px] lg:pr-[104px] lg:pt-[140px]">
            {/* Page Title */}
            <h1 className="text-[#1F2937] font-bold text-2xl lg:text-[30px] leading-8 lg:leading-[36px] mb-6 lg:mb-9">
              Greenerhouse Monitoring
            </h1>

            {/* Location Info */}
            <div className="flex items-center gap-2 mb-8 lg:mb-[97px]">
              <svg
                width="12"
                height="16"
                viewBox="0 0 12 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M6.74062 15.6C8.34375 13.5938 12 8.73125 12 6C12 2.6875 9.3125 0 6 0C2.6875 0 0 2.6875 0 6C0 8.73125 3.65625 13.5938 5.25938 15.6C5.64375 16.0781 6.35625 16.0781 6.74062 15.6ZM6 4C6.53043 4 7.03914 4.21071 7.41421 4.58579C7.78929 4.96086 8 5.46957 8 6C8 6.53043 7.78929 7.03914 7.41421 7.41421C7.03914 7.78929 6.53043 8 6 8C5.46957 8 4.96086 7.78929 4.58579 7.41421C4.21071 7.03914 4 6.53043 4 6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4Z"
                  fill="#004AB3"
                />
              </svg>
              <span className="text-[#4B5563] text-sm lg:text-base leading-5 lg:leading-6">
                Farm Location: Ait Melloul Souss Massa
              </span>
            </div>

            {/* Farm Overview Section */}
            <FarmOverview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
