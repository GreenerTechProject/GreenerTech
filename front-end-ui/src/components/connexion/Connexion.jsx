import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import axios from 'axios';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await axios.post('http://127.0.0.1:5000/api/login', {
      email,
      password: motDePasse,
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
  }
  
  );
    console.log(response.data);
   
    const { token, role, userId } = response.data;

    console.log(token)
    console.log(role)

    // Store token and role
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);


    switch (role) {
      case 'directeur':
        await navigate({ to: '/setUpPageGMaps' });
        break;
      case 'technicien_superieur':
        await navigate({ to: '/technicien-superieur-dashboard' });
        break;
      case 'technicien':
        await navigate({ to: '/technicien-dashboard' });
        break;
      default:
        alert("Unknown role");
    }
  } catch (error) {
    console.error("Login failed:", error);
    alert(error.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">GreenerTech Portal</h1>
            <p className="text-sm text-gray-500">Sign in to access the agricultural management system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <button 
                  type="button"
                  className="text-xs text-green-600 hover:text-green-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={motDePasse}
                onChange={e => setMotDePasse(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !email || !motDePasse}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Agricultural Management System v2.0
          </p>
        </div>
      </div>
    </div>
  );
}