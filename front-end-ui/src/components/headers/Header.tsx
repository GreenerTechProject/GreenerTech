// src/components/Header.tsx
import { Link, useNavigate } from '@tanstack/react-router'

export default function Header() {
  const navigate = useNavigate()

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <svg
              className="h-8 w-8 text-indigo-600"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M15.36 2.048a1 1 0 011.28 0l13.28 11.952a1 1 0 01-.64 1.752H18v11.248a1 1 0 01-2 0V15.752H2.72a1 1 0 01-.64-1.752L15.36 2.048z" />
            </svg>
            <span className="font-bold text-xl text-slate-800">GreenerTech</span>
          </Link>

          {/* Buttons */}
          <nav className="flex items-center space-x-3">
            <button
              onClick={() => navigate({ to: '/login' })}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate({ to: '/registration-route' })}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              Sign Up
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}