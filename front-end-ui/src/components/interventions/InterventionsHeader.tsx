import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { FloatingNavigation } from '../navigation'
import { useFloatingNavigation } from '../navigation/useFloatingNavigation'

const InterventionsHeader: React.FC = () => {
  const { isFloatingNavVisible, toggleFloatingNav, closeFloatingNav } = useFloatingNavigation();

  return (
    <>
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-19 max-w-7xl items-center px-6">
          {/* Three dots menu */}
          <button
            onClick={toggleFloatingNav}
            className="mr-8 rounded-lg bg-white p-3 shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Toggle navigation menu"
          >
          <div className="flex flex-col space-y-1">
            <div className="h-0.5 w-0.5 rounded-full bg-black"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-black"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-black"></div>
          </div>
        </button>

        {/* Logo */}
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/f204ee653615a1fcca6f4f94466f318f9ba86115?width=304"
          alt="GrennerTech"
          className="h-14 w-38"
        />

        {/* Navigation icons */}
        <div className="ml-auto flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <svg width="27" height="24" viewBox="0 0 27 24" fill="none" className="text-blue-700">
              <path
                d="M18 22.3171L9 19.7437V1.68275L18 4.25619V22.3171ZM19.5 22.2609V4.14369L25.4578 1.75775C26.1984 1.46244 27 2.00619 27 2.80306V18.4968C27 18.9562 26.7188 19.3687 26.2922 19.5421L19.5 22.2562V22.2609ZM0.707813 4.45775L7.5 1.74369V19.8562L1.54219 22.2421C0.801563 22.5374 0 21.9937 0 21.1968V5.50306C0 5.04369 0.28125 4.63119 0.707813 4.45775Z"
                fill="#004AB3"
              />
            </svg>
            <svg width="23" height="16" viewBox="0 0 23 16" fill="none" className="text-blue-700">
              <path
                d="M0 2.66667C0 1.19583 1.14601 0 2.55556 0H12.7778C14.1873 0 15.3333 1.19583 15.3333 2.66667V13.3333C15.3333 14.8042 14.1873 16 12.7778 16H2.55556C1.14601 16 0 14.8042 0 13.3333V2.66667ZM22.3252 1.49167C22.7404 1.725 23 2.175 23 2.66667V13.3333C23 13.825 22.7404 14.275 22.3252 14.5083C21.9099 14.7417 21.4068 14.7167 21.0115 14.4417L17.1781 11.775L16.6111 11.3792V10.6667V5.33333V4.62083L17.1781 4.225L21.0115 1.55833C21.4028 1.2875 21.9059 1.25833 22.3252 1.49167Z"
                fill="#004AB3"
              />
            </svg>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-64 rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-base text-gray-600 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
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

export default InterventionsHeader
