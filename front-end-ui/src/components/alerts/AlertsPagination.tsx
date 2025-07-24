import React from 'react'

const AlertsPagination: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
      {/* Results info */}
      <div className="text-[#374151] font-inter text-sm font-normal leading-normal">
        Affichage de 1 à 7 sur 10 alerte
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button className="flex px-3 py-2 justify-center items-center rounded-[6px] border border-[#D1D5DB] bg-white hover:bg-gray-50 transition-colors">
          <span className="text-[#6B7280] text-center font-inter text-sm font-medium leading-normal">
            Précédent
          </span>
        </button>

        {/* Page numbers */}
        <button className="flex w-8 h-9 justify-center items-center rounded-[6px] border border-transparent bg-[#004AB3] hover:bg-blue-700 transition-colors">
          <span className="text-white text-center font-inter text-sm font-medium leading-normal">
            1
          </span>
        </button>
        <button className="flex w-8 h-9 justify-center items-center rounded-[6px] border border-[#D1D5DB] bg-white hover:bg-gray-50 transition-colors">
          <span className="text-[#6B7280] text-center font-inter text-sm font-medium leading-normal">
            2
          </span>
        </button>
        <button className="flex w-8 h-9 justify-center items-center rounded-[6px] border border-[#D1D5DB] bg-white hover:bg-gray-50 transition-colors">
          <span className="text-[#6B7280] text-center font-inter text-sm font-medium leading-normal">
            3
          </span>
        </button>

        {/* Next button */}
        <button className="flex px-3 py-2 justify-center items-center rounded-[6px] border border-[#D1D5DB] bg-white hover:bg-gray-50 transition-colors">
          <span className="text-[#6B7280] text-center font-inter text-sm font-medium leading-normal">
            Suivant
          </span>
        </button>
      </div>
    </div>
  )
}

export default AlertsPagination
