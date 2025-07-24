import React from 'react'
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Intervention {
  id: string
  type: string
  typeIcon: string
  typeColor: string
  greenhouse: string
  completed: boolean
  notCompleted: boolean
}

const interventions: Intervention[] = [
  {
    id: '1',
    type: 'Préparation du Sol',
    typeIcon: '🌱',
    typeColor: 'bg-lime-400',
    greenhouse: 'Serre A1 / Domaine Nord / Bilan Q1',
    completed: true,
    notCompleted: false,
  },
  {
    id: '2',
    type: 'Plantation',
    typeIcon: '🌿',
    typeColor: 'bg-blue-700',
    greenhouse: 'Serre B2 / Domaine Sud / Bilan Q2',
    completed: false,
    notCompleted: true,
  },
  {
    id: '3',
    type: 'Palissage',
    typeIcon: '📏',
    typeColor: 'bg-yellow-500',
    greenhouse: 'Serre C3 / Domaine Est / Bilan Q1',
    completed: true,
    notCompleted: false,
  },
  {
    id: '4',
    type: 'Ébourgeonnage',
    typeIcon: '✂️',
    typeColor: 'bg-purple-500',
    greenhouse: 'Serre D4 / Domaine Ouest / Bilan Q3',
    completed: false,
    notCompleted: true,
  },
  {
    id: '5',
    type: 'Effeuillage',
    typeIcon: '🍃',
    typeColor: 'bg-green-600',
    greenhouse: 'Serre E5 / Domaine Central / Bilan Q2',
    completed: true,
    notCompleted: false,
  },
  {
    id: '6',
    type: 'Éclaircissage',
    typeIcon: '🔧',
    typeColor: 'bg-orange-500',
    greenhouse: 'Serre F6 / Domaine Nord / Bilan Q4',
    completed: false,
    notCompleted: true,
  },
]

const InterventionTypeIcon: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const getIcon = () => {
    switch (type) {
      case 'Préparation du Sol':
        return (
          <svg width="14" height="14" viewBox="0 0 14 15" fill="none">
            <path
              d="M14 1.625C14 4.73125 11.6867 7.29883 8.68984 7.69531C8.4957 6.23516 7.85313 4.91719 6.9043 3.88633C7.95156 2.01602 9.95312 0.75 12.25 0.75H13.125C13.609 0.75 14 1.14102 14 1.625ZM0 3.375C0 2.89102 0.391016 2.5 0.875 2.5H1.75C5.13242 2.5 7.875 5.24258 7.875 8.625V9.5V13.875C7.875 14.359 7.48398 14.75 7 14.75C6.51602 14.75 6.125 14.359 6.125 13.875V9.5C2.74258 9.5 0 6.75742 0 3.375Z"
              fill="white"
            />
          </svg>
        )
      case 'Plantation':
        return (
          <svg width="12" height="14" viewBox="0 0 14 15" fill="none">
            <path
              d="M6.63359 0.911328L2.57031 5.38203C2.46367 5.49687 2.40625 5.65 2.40625 5.80586C2.40625 6.15586 2.68789 6.4375 3.03789 6.4375H3.71875L1.71172 8.44453C1.59688 8.55937 1.53125 8.71797 1.53125 8.88203C1.53125 9.22383 1.80742 9.5 2.14922 9.5H3.0625L1.02266 11.9473C0.926953 12.0621 0.875 12.207 0.875 12.3574C0.875 12.7129 1.16211 13 1.51758 13H6.125V13.875C6.125 14.359 6.51602 14.75 7 14.75C7.48398 14.75 7.875 14.359 7.875 13.875V13H12.4824C12.8379 13 13.125 12.7129 13.125 12.3574C13.125 12.207 13.073 12.0621 12.9773 11.9473L10.9375 9.5H11.8508C12.1926 9.5 12.4688 9.22383 12.4688 8.88203C12.4688 8.71797 12.4031 8.55937 12.2883 8.44453L10.2812 6.4375H10.9621C11.3094 6.4375 11.5938 6.15586 11.5938 5.80586C11.5938 5.65 11.5363 5.49687 11.4297 5.38203L7.36641 0.911328C7.27344 0.807422 7.13945 0.75 7 0.75C6.86055 0.75 6.72656 0.807422 6.63359 0.911328Z"
              fill="white"
            />
          </svg>
        )
      case 'Palissage':
        return (
          <svg width="12" height="14" viewBox="0 0 14 15" fill="none">
            <path
              d="M1.75 8.625C1.26602 8.625 0.875 9.01602 0.875 9.5C0.875 9.98398 1.26602 10.375 1.75 10.375H12.25C12.734 10.375 13.125 9.98398 13.125 9.5C13.125 9.01602 12.734 8.625 12.25 8.625H1.75ZM1.75 5.125C1.26602 5.125 0.875 5.51602 0.875 6C0.875 6.48398 1.26602 6.875 1.75 6.875H12.25C12.734 6.875 13.125 6.48398 13.125 6C13.125 5.51602 12.734 5.125 12.25 5.125H1.75Z"
              fill="white"
            />
          </svg>
        )
      case 'Ébourgeonnage':
        return (
          <svg width="14" height="14" viewBox="0 0 14 15" fill="none">
            <path
              d="M7 6L5.91992 4.91992C6.05391 4.57539 6.125 4.20352 6.125 3.8125C6.125 2.11992 4.75508 0.75 3.0625 0.75C1.36992 0.75 0 2.11992 0 3.8125C0 5.50508 1.36992 6.875 3.0625 6.875C3.45352 6.875 3.82539 6.80117 4.16992 6.66992L5.25 7.75L4.16992 8.83008C3.82539 8.69609 3.45352 8.625 3.0625 8.625C1.36992 8.625 0 9.99492 0 11.6875C0 13.3801 1.36992 14.75 3.0625 14.75C4.75508 14.75 6.125 13.3801 6.125 11.6875C6.125 11.2965 6.05117 10.9246 5.91992 10.5801L13.65 2.85C13.8441 2.65586 13.8441 2.34414 13.65 2.15C12.8762 1.37617 11.6238 1.37617 10.85 2.15L7 6ZM7.61797 10.118L10.85 13.35C11.6238 14.1238 12.8762 14.1238 13.65 13.35C13.8441 13.1559 13.8441 12.8441 13.65 12.65L9.36797 8.36797L7.61797 10.118ZM1.75 3.8125C1.75 3.64014 1.78395 3.46947 1.84991 3.31023C1.91587 3.15099 2.01255 3.0063 2.13442 2.88442C2.2563 2.76255 2.40099 2.66587 2.56023 2.59991C2.71947 2.53395 2.89014 2.5 3.0625 2.5C3.23486 2.5 3.40553 2.53395 3.56477 2.59991C3.72401 2.66587 3.8687 2.76255 3.99058 2.88442C4.11245 3.0063 4.20913 3.15099 4.27509 3.31023C4.34105 3.46947 4.375 3.64014 4.375 3.8125C4.375 3.98486 4.34105 4.15553 4.27509 4.31477C4.20913 4.47401 4.11245 4.6187 3.99058 4.74058C3.8687 4.86245 3.72401 4.95913 3.56477 5.02509C3.40553 5.09105 3.23486 5.125 3.0625 5.125C2.89014 5.125 2.71947 5.09105 2.56023 5.02509C2.40099 4.95913 2.2563 4.86245 2.13442 4.74058C2.01255 4.6187 1.91587 4.47401 1.84991 4.31477C1.78395 4.15553 1.75 3.98486 1.75 3.8125ZM3.0625 10.375C3.23486 10.375 3.40553 10.4089 3.56477 10.4749C3.72401 10.5409 3.8687 10.6375 3.99058 10.7594C4.11245 10.8813 4.20913 11.026 4.27509 11.1852C4.34105 11.3445 4.375 11.5151 4.375 11.6875C4.375 11.8599 4.34105 12.0305 4.27509 12.1898C4.20913 12.349 4.11245 12.4937 3.99058 12.6156C3.8687 12.7375 3.72401 12.8341 3.56477 12.9001C3.40553 12.9661 3.23486 13 3.0625 13C2.89014 13 2.71947 12.9661 2.56023 12.9001C2.40099 12.8341 2.2563 12.7375 2.13442 12.6156C2.01255 12.4937 1.91587 12.349 1.84991 12.1898C1.78395 12.0305 1.75 11.8599 1.75 11.6875C1.75 11.5151 1.78395 11.3445 1.84991 11.1852C1.91587 11.026 2.01255 10.8813 2.13442 10.7594C2.2563 10.6375 2.40099 10.5409 2.56023 10.4749C2.71947 10.4089 2.89014 10.375 3.0625 10.375Z"
              fill="white"
            />
          </svg>
        )
      case 'Effeuillage':
        return (
          <svg width="14" height="14" viewBox="0 0 14 15" fill="none">
            <path
              d="M7.4375 3.37498C5.28828 3.37498 3.46992 4.78319 2.85195 6.72459C3.7707 6.25975 4.80703 5.99998 5.90625 5.99998H8.3125C8.55313 5.99998 8.75 6.19686 8.75 6.43748C8.75 6.67811 8.55313 6.87498 8.3125 6.87498H7.875H5.90625C5.45234 6.87498 5.01211 6.92694 4.58828 7.02264C3.88008 7.18397 3.22109 7.47108 2.63594 7.86209C1.04727 8.9203 0 10.7277 0 12.7812V13.2187C0 13.5824 0.292578 13.875 0.65625 13.875C1.01992 13.875 1.3125 13.5824 1.3125 13.2187V12.7812C1.3125 11.4496 1.87852 10.2519 2.78359 9.41248C3.325 11.4769 5.20352 13 7.4375 13H7.46484C11.077 12.9808 14 9.42069 14 5.03201C14 3.86717 13.7949 2.75975 13.423 1.7617C13.352 1.57303 13.0758 1.58123 12.9801 1.75897C12.466 2.72147 11.4488 3.37498 10.2812 3.37498H7.4375Z"
              fill="white"
            />
          </svg>
        )
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 14 15" fill="none">
            <path
              d="M7 6L5.91992 4.91992C6.05391 4.57539 6.125 4.20352 6.125 3.8125C6.125 2.11992 4.75508 0.75 3.0625 0.75C1.36992 0.75 0 2.11992 0 3.8125C0 5.50508 1.36992 6.875 3.0625 6.875C3.45352 6.875 3.82539 6.80117 4.16992 6.66992L5.25 7.75L4.16992 8.83008C3.82539 8.69609 3.45352 8.625 3.0625 8.625C1.36992 8.625 0 9.99492 0 11.6875C0 13.3801 1.36992 14.75 3.0625 14.75C4.75508 14.75 6.125 13.3801 6.125 11.6875C6.125 11.2965 6.05117 10.9246 5.91992 10.5801L13.65 2.85C13.8441 2.65586 13.8441 2.34414 13.65 2.15C12.8762 1.37617 11.6238 1.37617 10.85 2.15L7 6ZM7.61797 10.118L10.85 13.35C11.6238 14.1238 12.8762 14.1238 13.65 13.35C13.8441 13.1559 13.8441 12.8441 13.65 12.65L9.36797 8.36797L7.61797 10.118ZM1.75 3.8125C1.75 3.64014 1.78395 3.46947 1.84991 3.31023C1.91587 3.15099 2.01255 3.0063 2.13442 2.88442C2.2563 2.76255 2.40099 2.66587 2.56023 2.59991C2.71947 2.53395 2.89014 2.5 3.0625 2.5C3.23486 2.5 3.40553 2.53395 3.56477 2.59991C3.72401 2.66587 3.8687 2.76255 3.99058 2.88442C4.11245 3.0063 4.20913 3.15099 4.27509 3.31023C4.34105 3.46947 4.375 3.64014 4.375 3.8125C4.375 3.98486 4.34105 4.15553 4.27509 4.31477C4.20913 4.47401 4.11245 4.6187 3.99058 4.74058C3.8687 4.86245 3.72401 4.95913 3.56477 5.02509C3.40553 5.09105 3.23486 5.125 3.0625 5.125C2.89014 5.125 2.71947 5.09105 2.56023 5.02509C2.40099 4.95913 2.2563 4.86245 2.13442 4.74058C2.01255 4.6187 1.91587 4.47401 1.84991 4.31477C1.78395 4.15553 1.75 3.98486 1.75 3.8125ZM3.0625 10.375C3.23486 10.375 3.40553 10.4089 3.56477 10.4749C3.72401 10.5409 3.8687 10.6375 3.99058 10.7594C4.11245 10.8813 4.20913 11.026 4.27509 11.1852C4.34105 11.3445 4.375 11.5151 4.375 11.6875C4.375 11.8599 4.34105 12.0305 4.27509 12.1898C4.20913 12.349 4.11245 12.4937 3.99058 12.6156C3.8687 12.7375 3.72401 12.8341 3.56477 12.9001C3.40553 12.9661 3.23486 13 3.0625 13C2.89014 13 2.71947 12.9661 2.56023 12.9001C2.40099 12.8341 2.2563 12.7375 2.13442 12.6156C2.01255 12.4937 1.91587 12.349 1.84991 12.1898C1.78395 12.0305 1.75 11.8599 1.75 11.6875C1.75 11.5151 1.78395 11.3445 1.84991 11.1852C1.91587 11.026 2.01255 10.8813 2.13442 10.7594C2.2563 10.6375 2.40099 10.5409 2.56023 10.4749C2.71947 10.4089 2.89014 10.375 3.0625 10.375Z"
              fill="white"
            />
          </svg>
        )
    }
  }

  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
      {getIcon()}
    </div>
  )
}

const StatusBadges: React.FC<{ completed: boolean; notCompleted: boolean }> = ({
  completed,
  notCompleted,
}) => {
  return (
    <div className="flex items-start space-x-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          completed
            ? 'bg-emerald-500 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        Terminé
      </span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          notCompleted
            ? 'bg-red-500 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        Non Terminé
      </span>
    </div>
  )
}

const InterventionsTable: React.FC = () => {
  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              Type d'intervention
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              ID Serre
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Statut
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {interventions.map((intervention, index) => (
            <tr
              key={intervention.id}
              className={`${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <InterventionTypeIcon
                    type={intervention.type}
                    color={intervention.typeColor}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {intervention.type}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-900">
                  {intervention.greenhouse}
                </span>
              </td>
              <td className="px-6 py-4">
                <StatusBadges
                  completed={intervention.completed}
                  notCompleted={intervention.notCompleted}
                />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center space-x-4">
                  <button className="text-blue-700 hover:text-blue-900">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InterventionsTable
