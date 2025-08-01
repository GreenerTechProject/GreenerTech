import React, { useState } from 'react';
import NavigationIcon from './NavigationIcon';

const SideNavigation: React.FC = () => {
  const [activeIcon, setActiveIcon] = useState<string>('analysis');

  const handleIconClick = (iconName: string) => {
    setActiveIcon(iconName);
    console.log(`Clicked on ${iconName} icon`);
    // Add your navigation logic here
  };

  const handleMenuClick = () => {
    console.log('Menu button clicked');
    // Add your menu logic here
  };

  return (
    <div className="w-full lg:w-8 flex lg:flex-col items-center gap-3 lg:gap-5 p-4 lg:p-0">
      {/* Logo/Menu Button - Hidden on mobile since it's in header */}
      <button
        onClick={handleMenuClick}
        className="hidden lg:flex h-8 items-center justify-center gap-3 p-2 w-full hover:bg-gray-100 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        aria-label="Menu"
      >
        <svg
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0.25 3.75C0.25 3.05859 0.808594 2.5 1.5 2.5H16.5C17.1914 2.5 17.75 3.05859 17.75 3.75C17.75 4.44141 17.1914 5 16.5 5H1.5C0.808594 5 0.25 4.44141 0.25 3.75ZM0.25 10C0.25 9.30859 0.808594 8.75 1.5 8.75H16.5C17.1914 8.75 17.75 9.30859 17.75 10C17.75 10.6914 17.1914 11.25 16.5 11.25H1.5C0.808594 11.25 0.25 10.6914 0.25 10ZM17.75 16.25C17.75 16.9414 17.1914 17.5 16.5 17.5H1.5C0.808594 17.5 0.25 16.9414 0.25 16.25C0.25 15.5586 0.808594 15 1.5 15H16.5C17.1914 15 17.75 15.5586 17.75 16.25Z"
            fill="#475766"
          />
        </svg>
      </button>

      {/* Navigation Icons - Horizontal on mobile, vertical on desktop */}
      <div className="flex lg:flex-col items-center gap-3 lg:gap-2.5 overflow-x-auto lg:overflow-x-visible w-full lg:w-auto">
        <NavigationIcon
          icon="dashboard"
          isActive={activeIcon === 'dashboard'}
          hasNotification={false}
          onClick={() => handleIconClick('dashboard')}
        />

        <NavigationIcon
          icon="box"
          isActive={activeIcon === 'box'}
          hasNotification={false}
          onClick={() => handleIconClick('box')}
        />

        <NavigationIcon
          icon="analysis"
          isActive={activeIcon === 'analysis'}
          hasNotification={false}
          onClick={() => handleIconClick('analysis')}
        />

        <NavigationIcon
          icon="calendar"
          isActive={activeIcon === 'calendar'}
          hasNotification={true}
          onClick={() => handleIconClick('calendar')}
        />

        <NavigationIcon
          icon="clock"
          isActive={activeIcon === 'clock'}
          hasNotification={false}
          onClick={() => handleIconClick('clock')}
        />

        <NavigationIcon
          icon="money"
          isActive={activeIcon === 'money'}
          hasNotification={false}
          onClick={() => handleIconClick('money')}
        />
      </div>
    </div>
  );
};

export default SideNavigation;
