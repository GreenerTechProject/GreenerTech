// src/components/FloatingDashboardFAB.tsx
import { useNavigate } from '@tanstack/react-router'
import { HomeIcon } from '@heroicons/react/24/solid'

export default function FloatingDashboardFAB() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate({ to: '/dashboard' })}
      className="fixed bottom-5 left-5 z-50 w-12 h-12 rounded-full
                 bg-green-600 text-white shadow-xl
                 hover:bg-green-700 focus:ring-2 focus:ring-green-500
                 transition-transform hover:scale-110"
      aria-label="Dashboard"
    >
      <HomeIcon className="w-6 h-6 mx-auto" />
    </button>
  )
}