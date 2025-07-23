import React from 'react'
import AlertsHeader from './AlertsHeader'
import AlertsSearch from './AlertsSearch'
import AlertsTable from './AlertsTable'
import AlertsPagination from './AlertsPagination'
import AlertsStats from './AlertsStats'

const AlertsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F8F8] w-full">
      {/* Header */}
      <AlertsHeader />

      {/* Main Content */}
      <main className="w-full px-4 md:px-8 lg:px-20 xl:px-[80px] pt-16 md:pt-[65px]">
        <div className="w-full max-w-7xl mx-auto pt-8 md:pt-[70px]">
          {/* Title Section */}
          <div className="flex flex-col items-start gap-4 mb-6 md:mb-8">
            <h1 className="text-[#1F2937] font-inter text-2xl md:text-[30px] font-bold leading-tight md:leading-[36px]">
              Gestion des Alertes
            </h1>
            <p className="text-[#4B5563] font-inter text-sm md:text-[16px] font-normal leading-6">
              Surveillez et gérez toutes les alertes de votre système
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-6">
            <AlertsSearch />
          </div>

          {/* Table Section */}
          <div className="w-full rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] mb-4 md:mb-6 overflow-hidden">
            <AlertsTable />
          </div>

          {/* Pagination Section */}
          <div className="mb-6 md:mb-8">
            <AlertsPagination />
          </div>

          {/* Statistics Section */}
          <AlertsStats />
        </div>
      </main>
    </div>
  )
}

export default AlertsPage
