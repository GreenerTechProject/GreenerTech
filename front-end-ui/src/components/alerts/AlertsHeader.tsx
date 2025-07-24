import React from 'react'
import { FloatingNavigation } from '../navigation'
import { useFloatingNavigation } from '../navigation/useFloatingNavigation'

const AlertsHeader: React.FC = () => {
  const { isFloatingNavVisible, toggleFloatingNav, closeFloatingNav } = useFloatingNavigation();

  return (
    <>
      <header className="w-full h-16 md:h-[75px] border-b border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] fixed top-0 left-0 z-50">
        <div className="w-full h-full px-4 md:px-8 lg:px-20 xl:px-[110px] flex items-center justify-between">
          {/* Left Section - Menu and Logo */}
          <div className="flex items-center gap-4">
            {/* Menu Button */}
            <button
              onClick={toggleFloatingNav}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
            <svg
              className="w-8 h-8 md:w-10 md:h-10"
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g filter="url(#filter0_d_220_1348)">
                <rect x="44" y="2" width="40" height="40" rx="10" transform="rotate(90 44 2)" fill="white"/>
              </g>
              <circle cx="24" cy="15" r="2" fill="black"/>
              <circle cx="24" cy="22" r="2" fill="black"/>
              <circle cx="24" cy="29" r="2" fill="black"/>
              <defs>
                <filter id="filter0_d_220_1348" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="2"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_220_1348"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_220_1348" result="shape"/>
                </filter>
              </defs>
            </svg>
          </button>

          {/* Logo */}
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/f204ee653615a1fcca6f4f94466f318f9ba86115?width=304"
            alt="Logo"
            className="w-24 h-8 md:w-[152px] md:h-[57px] object-contain"
          />
        </div>

        {/* Center Navigation Icons - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4">
          <svg
            className="w-6 h-5 md:w-[27px] md:h-[24px]"
            width="27"
            height="24"
            viewBox="0 0 27 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M18 22.3171L9 19.7437V1.68275L18 4.25619V22.3171ZM19.5 22.2609V4.14369L25.4578 1.75775C26.1984 1.46244 27 2.00619 27 2.80306V18.4968C27 18.9562 26.7188 19.3687 26.2922 19.5421L19.5 22.2562V22.2609ZM0.707813 4.45775L7.5 1.74369V19.8562L1.54219 22.2421C0.801563 22.5374 0 21.9937 0 21.1968V5.50306C0 5.04369 0.28125 4.63119 0.707813 4.45775Z" fill="#004AB3"/>
          </svg>
          <svg
            className="w-5 h-4 md:w-[23px] md:h-[16px]"
            width="23"
            height="16"
            viewBox="0 0 23 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 2.66667C0 1.19583 1.14601 0 2.55556 0H12.7778C14.1873 0 15.3333 1.19583 15.3333 2.66667V13.3333C15.3333 14.8042 14.1873 16 12.7778 16H2.55556C1.14601 16 0 14.8042 0 13.3333V2.66667ZM22.3252 1.49167C22.7404 1.725 23 2.175 23 2.66667V13.3333C23 13.825 22.7404 14.275 22.3252 14.5083C21.9099 14.7417 21.4068 14.7167 21.0115 14.4417L17.1781 11.775L16.6111 11.3792V10.6667V5.33333V4.62083L17.1781 4.225L21.0115 1.55833C21.4028 1.2875 21.9059 1.25833 22.3252 1.49167Z" fill="#004AB3"/>
          </svg>
        </div>

        {/* Right Section - Search */}
        <div className="hidden md:flex items-center">
          <div className="w-48 lg:w-[256px] h-8 md:h-[42px] relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_220_1343)">
                  <path d="M13 6.5C13 7.93437 12.5344 9.25938 11.75 10.3344L15.7063 14.2937C16.0969 14.6844 16.0969 15.3188 15.7063 15.7094C15.3156 16.1 14.6812 16.1 14.2906 15.7094L10.3344 11.75C9.25938 12.5375 7.93437 13 6.5 13C2.90937 13 0 10.0906 0 6.5C0 2.90937 2.90937 0 6.5 0C10.0906 0 13 2.90937 13 6.5ZM6.5 11C7.09095 11 7.67611 10.8836 8.22208 10.6575C8.76804 10.4313 9.26412 10.0998 9.68198 9.68198C10.0998 9.26412 10.4313 8.76804 10.6575 8.22208C10.8836 7.67611 11 7.09095 11 6.5C11 5.90905 10.8836 5.32389 10.6575 4.77792C10.4313 4.23196 10.0998 3.73588 9.68198 3.31802C9.26412 2.90016 8.76804 2.56869 8.22208 2.34254C7.67611 2.1164 7.09095 2 6.5 2C5.90905 2 5.32389 2.1164 4.77792 2.34254C4.23196 2.56869 3.73588 2.90016 3.31802 3.31802C2.90016 3.73588 2.56869 4.23196 2.34254 4.77792C2.1164 5.32389 2 5.90905 2 6.5C2 7.09095 2.1164 7.67611 2.34254 8.22208C2.56869 8.76804 2.90016 9.26412 3.31802 9.68198C3.73588 10.0998 4.23196 10.4313 4.77792 10.6575C5.32389 10.8836 5.90905 11 6.5 11Z" fill="#9CA3AF"/>
                </g>
                <defs>
                  <clipPath id="clip0_220_1343">
                    <path d="M0 0H16V16H0V0Z" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full h-full pl-10 pr-4 rounded-[8px] border border-[#D1D5DB] bg-white text-[#ADAEBC] font-inter text-sm md:text-[16px] font-normal leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Mobile Search Button */}
        <button className="md:hidden w-8 h-8 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_220_1343)">
              <path d="M13 6.5C13 7.93437 12.5344 9.25938 11.75 10.3344L15.7063 14.2937C16.0969 14.6844 16.0969 15.3188 15.7063 15.7094C15.3156 16.1 14.6812 16.1 14.2906 15.7094L10.3344 11.75C9.25938 12.5375 7.93437 13 6.5 13C2.90937 13 0 10.0906 0 6.5C0 2.90937 2.90937 0 6.5 0C10.0906 0 13 2.90937 13 6.5ZM6.5 11C7.09095 11 7.67611 10.8836 8.22208 10.6575C8.76804 10.4313 9.26412 10.0998 9.68198 9.68198C10.0998 9.26412 10.4313 8.76804 10.6575 8.22208C10.8836 7.67611 11 7.09095 11 6.5C11 5.90905 10.8836 5.32389 10.6575 4.77792C10.4313 4.23196 10.0998 3.73588 9.68198 3.31802C9.26412 2.90016 8.76804 2.56869 8.22208 2.34254C7.67611 2.1164 7.09095 2 6.5 2C5.90905 2 5.32389 2.1164 4.77792 2.34254C4.23196 2.56869 3.73588 2.90016 3.31802 3.31802C2.90016 3.73588 2.56869 4.23196 2.34254 4.77792C2.1164 5.32389 2 5.90905 2 6.5C2 7.09095 2.1164 7.67611 2.34254 8.22208C2.56869 8.76804 2.90016 9.26412 3.31802 9.68198C3.73588 10.0998 4.23196 10.4313 4.77792 10.6575C5.32389 10.8836 5.90905 11 6.5 11Z" fill="#9CA3AF"/>
            </g>
            <defs>
              <clipPath id="clip0_220_1343">
                <path d="M0 0H16V16H0V0Z" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </button>
      </div>
    </header>

    {/* Floating Navigation */}
    <FloatingNavigation
      isVisible={isFloatingNavVisible}
      onClose={closeFloatingNav}
    />
  </>
  )
}

export default AlertsHeader
