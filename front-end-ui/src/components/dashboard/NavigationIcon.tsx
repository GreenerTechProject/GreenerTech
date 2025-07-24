import React from 'react';

interface NavigationIconProps {
  icon: 'dashboard' | 'box' | 'analysis' | 'calendar' | 'clock' | 'money';
  isActive?: boolean;
  hasNotification?: boolean;
  onClick?: () => void;
}

const NavigationIcon: React.FC<NavigationIconProps> = ({
  icon,
  isActive = false,
  hasNotification = false,
  onClick
}) => {
  const getIconContent = () => {
    switch (icon) {
      case 'dashboard':
        return (
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/b556d4cd8e6a0860af912cd4399ac2e1b58d120e?width=40"
            alt="Dashboard"
            className="w-5 h-5"
          />
        );
      case 'box':
        return (
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/838a50c13ac4621e0b4dc5452e99ce33ea8ad620?width=40"
            alt="Box"
            className="w-5 h-5"
          />
        );
      case 'analysis':
        return (
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/7401051f553f966537706f929cf87fecee83e3ab?width=40"
            alt="Analysis"
            className="w-5 h-5"
          />
        );
      case 'calendar':
        return (
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/e7653d5a0be1a20e459317be52d27481e01176b4?width=40"
            alt="Calendar"
            className="w-5 h-5"
          />
        );
      case 'clock':
        return (
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/373e05218fd0036df46904072de8efa1c1eb0e18?width=40"
            alt="Clock"
            className="w-5 h-5"
          />
        );
      case 'money':
        return (
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/941819fd1e559529c4cdae1e33c57fff636bc5f2?width=40"
            alt="Money"
            className="w-5 h-5"
          />
        );
      default:
        return null;
    }
  };

  const getIconLabel = () => {
    switch (icon) {
      case 'dashboard':
        return 'Dashboard';
      case 'box':
        return 'Box';
      case 'analysis':
        return 'Analysis';
      case 'calendar':
        return 'Calendar';
      case 'clock':
        return 'Clock';
      case 'money':
        return 'Money';
      default:
        return '';
    }
  };

  return (
    <div className="relative">
      {/* Notification Dot */}
      {hasNotification && (
        <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-red-500 rounded-full z-10" />
      )}

      {/* Interactive Icon Button */}
      <button
        onClick={onClick}
        className={`flex p-1 items-center justify-center gap-2.5 w-7 h-7 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isActive
            ? 'rounded-full bg-[#F1F5F9]'
            : 'hover:rounded-full hover:bg-[#F1F5F9] active:scale-95'
        }`}
        aria-label={getIconLabel()}
        role="button"
        tabIndex={0}
      >
        {getIconContent()}
      </button>
    </div>
  );
};

export default NavigationIcon;
