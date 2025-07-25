import React from 'react'
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { PencilIcon } from '@heroicons/react/24/solid'

const InterventionsSearch: React.FC = () => {
  return (
    <div className="flex items-center justify-between">
      {/* Search Input */}
      <div className="relative w-112">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher une Intervention..."
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-600 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-2">
        {/* Sort Button */}
        <button className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5">
          <div className="flex flex-col items-center">
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path
                d="M4.29354 1.2937C4.68416 0.903076 5.31854 0.903076 5.70916 1.2937L9.70916 5.2937C9.99666 5.5812 10.081 6.00933 9.92479 6.38433C9.76854 6.75933 9.40604 7.00308 8.99979 7.00308H0.999786C0.596662 7.00308 0.231037 6.75933 0.0747866 6.38433C-0.0814634 6.00933 0.00603655 5.5812 0.290412 5.2937L4.29041 1.2937H4.29354ZM4.29354 14.7093L0.293537 10.7093C0.00603655 10.4218 -0.0783385 9.9937 0.0779115 9.6187C0.234162 9.2437 0.596661 8.99995 1.00291 8.99995H8.99979C9.40291 8.99995 9.76854 9.2437 9.92479 9.6187C10.081 9.9937 9.99354 10.4218 9.70916 10.7093L5.70916 14.7093C5.31854 15.1 4.68416 15.1 4.29354 14.7093Z"
                fill="#4B5563"
              />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">Trier par</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-gray-600" />
        </button>

        {/* Request Intervention Button */}
        <button className="flex items-center space-x-2 rounded-lg bg-lime-400 px-6 py-2.5 text-white hover:bg-lime-500">
          <PencilIcon className="h-3.5 w-3.5 text-white" />
          <span className="text-sm font-medium">Demande une intervention</span>
        </button>
      </div>
    </div>
  )
}

export default InterventionsSearch
