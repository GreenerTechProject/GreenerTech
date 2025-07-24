import React from 'react'

interface Alert {
  id: number
  name: string
  level: 'High' | 'Medium' | 'Low'
  status: 'Résolu' | 'Non Résolu'
  location: string
  timestamp: string
}

const mockAlerts: Alert[] = [
  {
    id: 1,
    name: 'Température élevée détectée',
    level: 'High',
    status: 'Non Résolu',
    location: 'Serre A / Domaine Nord / Bilan Q1',
    timestamp: '15/07/2025 14:23'
  },
  {
    id: 2,
    name: 'Humidité faible',
    level: 'Medium',
    status: 'Résolu',
    location: 'Serre B / Domaine Sud / Bilan Q2',
    timestamp: '15/07/2025 12:45'
  },
  {
    id: 3,
    name: 'Défaillance capteur CO2',
    level: 'High',
    status: 'Non Résolu',
    location: 'Serre C / Domaine Est / Bilan Q1',
    timestamp: '15/07/2025 11:30'
  },
  {
    id: 4,
    name: 'Niveau d\'eau bas',
    level: 'Low',
    status: 'Résolu',
    location: 'Serre D / Domaine Ouest / Bilan Q3',
    timestamp: '15/07/2025 09:15'
  },
  {
    id: 5,
    name: 'Éclairage défectueux',
    level: 'Medium',
    status: 'Non Résolu',
    location: 'Serre E / Domaine Central / Bilan Q2',
    timestamp: '15/07/2025 08:42'
  },
  {
    id: 6,
    name: 'Ventilation insuffisante',
    level: 'Low',
    status: 'Résolu',
    location: 'Serre F / Domaine Nord / Bilan Q4',
    timestamp: '14/07/2025 16:28'
  }
]

const AlertsTable: React.FC = () => {
  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-[#FEE2E2] text-[#991B1B]'
      case 'Medium':
        return 'bg-[#FFEDD5] text-[#9A3412]'
      case 'Low':
        return 'bg-[#DCFCE7] text-[#166534]'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusStyles = (status: string) => {
    return status === 'Résolu'
      ? 'bg-[#DCFCE7] text-[#166534]'
      : 'bg-[#FEE2E2] text-[#991B1B]'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Résolu') {
      return (
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_220_1203)">
            <path d="M6.0625 12.5C7.6538 12.5 9.17992 11.8679 10.3051 10.7426C11.4304 9.61742 12.0625 8.0913 12.0625 6.5C12.0625 4.9087 11.4304 3.38258 10.3051 2.25736C9.17992 1.13214 7.6538 0.5 6.0625 0.5C4.4712 0.5 2.94508 1.13214 1.81986 2.25736C0.694641 3.38258 0.0625 4.9087 0.0625 6.5C0.0625 8.0913 0.694641 9.61742 1.81986 10.7426C2.94508 11.8679 4.4712 12.5 6.0625 12.5ZM8.71094 5.39844L5.71094 8.39844C5.49062 8.61875 5.13438 8.61875 4.91641 8.39844L3.41641 6.89844C3.19609 6.67812 3.19609 6.32188 3.41641 6.10391C3.63672 5.88594 3.99297 5.88359 4.21094 6.10391L5.3125 7.20547L7.91406 4.60156C8.13437 4.38125 8.49062 4.38125 8.70859 4.60156C8.92656 4.82188 8.92891 5.17812 8.70859 5.39609L8.71094 5.39844Z" fill="#166534"/>
          </g>
          <defs>
            <clipPath id="clip0_220_1203">
              <path d="M0.0625 0.5H12.0625V12.5H0.0625V0.5Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      )
    } else {
      return (
        <svg width="12" height="12" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_220_1186)">
            <path d="M6.0625 12.5C7.6538 12.5 9.17992 11.8679 10.3051 10.7426C11.4304 9.61742 12.0625 8.0913 12.0625 6.5C12.0625 4.9087 11.4304 3.38258 10.3051 2.25736C9.17992 1.13214 7.6538 0.5 6.0625 0.5C4.4712 0.5 2.94508 1.13214 1.81986 2.25736C0.694641 3.38258 0.0625 4.9087 0.0625 6.5C0.0625 8.0913 0.694641 9.61742 1.81986 10.7426C2.94508 11.8679 4.4712 12.5 6.0625 12.5ZM6.0625 3.5C6.37422 3.5 6.625 3.75078 6.625 4.0625V6.6875C6.625 6.99922 6.37422 7.25 6.0625 7.25C5.75078 7.25 5.5 6.99922 5.5 6.6875V4.0625C5.5 3.75078 5.75078 3.5 6.0625 3.5ZM5.3125 8.75C5.3125 8.55109 5.39152 8.36032 5.53217 8.21967C5.67282 8.07902 5.86359 8 6.0625 8C6.26141 8 6.45218 8.07902 6.59283 8.21967C6.73348 8.36032 6.8125 8.55109 6.8125 8.75C6.8125 8.94891 6.73348 9.13968 6.59283 9.28033C6.45218 9.42098 6.26141 9.5 6.0625 9.5C5.86359 9.5 5.67282 9.42098 5.53217 9.28033C5.39152 9.13968 5.3125 8.94891 5.3125 8.75Z" fill="#991B1B"/>
          </g>
          <defs>
            <clipPath id="clip0_220_1186">
              <path d="M0.0625 0.5H12.0625V12.5H0.0625V0.5Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
      )
    }
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[768px] bg-white">
        {/* Table Header */}
        <thead className="bg-[#F9FAFB]">
          <tr>
            <th className="px-6 py-4 text-left">
              <span className="text-[#4B5563] font-inter text-xs font-semibold leading-normal tracking-[0.6px]">
                Nom d'anomalie
              </span>
            </th>
            <th className="px-6 py-4 text-left">
              <span className="text-[#4B5563] font-inter text-xs font-semibold leading-normal tracking-[0.6px]">
                Niveau
              </span>
            </th>
            <th className="px-6 py-4 text-left">
              <span className="text-[#4B5563] font-inter text-xs font-semibold leading-normal tracking-[0.6px]">
                Statut
              </span>
            </th>
            <th className="px-6 py-4 text-left">
              <span className="text-[#4B5563] font-inter text-xs font-semibold leading-normal tracking-[0.6px]">
                Localisation
              </span>
            </th>
            <th className="px-6 py-4 text-left">
              <span className="text-[#4B5563] font-inter text-xs font-semibold leading-normal tracking-[0.6px]">
                Horodatage
              </span>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-white">
          {mockAlerts.map((alert, index) => (
            <tr key={alert.id} className={`${index % 2 === 1 ? 'bg-[#F9FAFB]' : 'bg-white'} ${index > 0 ? 'border-t border-[#E5E7EB]' : ''}`}>
              <td className="px-6 py-4">
                <span className="text-[#111827] font-inter text-sm font-medium leading-normal">
                  {alert.name}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getLevelStyles(alert.level)}`}>
                  {alert.level}
                </span>
              </td>
              <td className="px-6 py-4">
                <button className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${getStatusStyles(alert.status)}`}>
                  <div className="w-3 h-3 flex items-center justify-center">
                    {getStatusIcon(alert.status)}
                  </div>
                  <span>
                    {alert.status}
                  </span>
                </button>
              </td>
              <td className="px-6 py-4">
                <span className="text-[#4B5563] font-inter text-sm font-normal leading-normal">
                  {alert.location}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-[#4B5563] font-inter text-sm font-normal leading-normal">
                  {alert.timestamp}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AlertsTable
