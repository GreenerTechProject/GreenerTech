import React from 'react'

const InterventionsPagination: React.FC = () => {
  return (
    <div className="mt-6 flex items-center justify-between">
      {/* Results info */}
      <div className="text-sm text-gray-700">
        Affichage de 1 à 7 sur 10 intervention
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center space-x-2">
        <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Précédent
        </button>
        
        <button className="rounded-md border border-transparent bg-blue-700 px-3 py-2 text-sm font-medium text-white">
          1
        </button>
        
        <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          2
        </button>
        
        <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          3
        </button>
        
        <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Suivant
        </button>
      </div>
    </div>
  )
}

export default InterventionsPagination
