import React from 'react'
import InterventionsHeader from './InterventionsHeader'
import InterventionsSearch from './InterventionsSearch'
import InterventionsTable from './InterventionsTable'
import InterventionsPagination from './InterventionsPagination'

const InterventionsPage: React.FC = () => {
  return (
    <div className="flex h-full flex-col bg-gray-50">
      <InterventionsHeader />
      <main className="w-full bg-gray-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-14">
          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-9 text-gray-900">
              Gestion des Interventions
            </h1>
            <p className="mt-4 text-base text-gray-600">
              Suivi et gestion des interventions entre superviseurs et techniciens
            </p>
          </div>
          
          <InterventionsSearch />
          
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <InterventionsTable />
          </div>
          
          <InterventionsPagination />
        </div>
      </main>
    </div>
  )
}

export default InterventionsPage
