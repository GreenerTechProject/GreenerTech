import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import axios from 'axios';

export default function InscriptionDirecteur() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [skipCompany, setSkipCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [directorId, setDirectorId] = useState<string | null>(null); // To store director ID for company registration
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    company: {
      company_name: '',
      legal_status: '',
      address: '',
      id_fiscale: '',
      national_id: '',
      company_email: ''
    }
  });

  const legalStatusOptions = ['SARL', 'SA', 'SAS', 'Cooperative', 'EI'];

  // Form validation
  const isStep1Valid = formData.fullName.trim() && 
                      formData.email.trim() && 
                      formData.password.trim().length >= 8;

  const isStep2Valid = formData.company.company_name.trim() && 
                      formData.company.legal_status && 
                      formData.company.id_fiscale.trim();

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      company: { ...prev.company, [name]: value }
    }));
    setError(null);
  };

  // Navigation
  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid) return;
    setStep(2);
  };

  const goBackToStep1 = () => {
    setStep(1);
    setSkipCompany(false);
  };

  // Register director
 const registerDirector = async () => {
  try {
    const directorData = {
      name: formData.fullName,  
      email: formData.email,
      password: formData.password
    };

    const response = await axios.post('http://localhost:5000/api/register', directorData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    setMessage(response.data.message);
    
    // Store token in localStorage
    localStorage.setItem('token', response.data.token);
    console.log(response.data);
    
    // Return the user ID for company registration
    return response.data.userId;
  } catch (error) {
    console.error('Director registration error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 
                     `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response received from server');
    } else {
      throw new Error('Registration error: ' + error.message);
    }
  }
};

  // Register company
  const registerCompany = async (directorId: string) => {
    const companyData = {
      id_user: directorId,
      nom: formData.company.company_name,
      status_juridique: formData.company.legal_status,
      adresse: formData.company.address,
      id_fiscale: formData.company.id_fiscale,
      id_nationale: formData.company.national_id,
      email: formData.company.company_email
    };

    await axios.post('http://localhost:5000/api/entreprise', companyData, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  };

  
  // Form submission
  const handleSubmit = async (e: React.FormEvent | null, skip = false) => {
  e?.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // Step 1: Register director
    const userId = await registerDirector();
    setDirectorId(userId);

    // Step 2: Register company if not skipped
    if (!skip) {
      try {
        await registerCompany(userId);
      } catch (companyError) {
        console.error('Company registration failed but director was created:', companyError);
        // Continue to success page even if company registration fails
        // but show a warning message
        setError('Director account created but company registration failed. You can add company information later.');
      }
    }

    setRegistrationSuccess(true);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during registration';
    setError(errorMessage);
    console.error("Registration error:", err);
  } finally {
    setLoading(false);
  }
};

  const handleSkipCompany = () => {
    setSkipCompany(true);
    handleSubmit(null, true);
  };

  // Registration success confirmation
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
    <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Registration Successful</h2>
        <p className="text-gray-600 mb-6">
          Your account has been created. Please check your email to verify your account before logging in.
        </p>
        <button
          onClick={() => navigate({ to: '/connexion' })}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  </div>
    );
  }

  // Step 1 - Personal Info
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Director Registration</h1>
              <p className="text-gray-500 mt-2">Step 1 of 2 - Personal Information</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={goToStep2} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  minLength={8}
                  required
                />
                <p className="mt-2 text-xs text-gray-500">Password must be at least 8 characters</p>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isStep1Valid || loading}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 - Company Info
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Company Information</h1>
            <p className="text-gray-500 mt-2">Step 2 of 2 - Optional</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {!skipCompany ? (
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  name="company_name"
                  value={formData.company.company_name}
                  onChange={handleCompanyChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal ID</label>
                  <input
                    name="id_fiscale"
                    value={formData.company.id_fiscale}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Status</label>
                  <select
                    name="legal_status"
                    value={formData.company.legal_status}
                    onChange={handleCompanyChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select legal status</option>
                    {legalStatusOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                <input
                  name="national_id"
                  value={formData.company.national_id}
                  onChange={handleCompanyChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                <input
                  name="address"
                  value={formData.company.address}
                  onChange={handleCompanyChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                <input
                  name="company_email"
                  type="email"
                  value={formData.company.company_email}
                  onChange={handleCompanyChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={goBackToStep1}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSkipCompany}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                  >
                    Skip Company Info
                  </button>
                  <button
                    type="submit"
                    disabled={!isStep2Valid || loading}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your registration...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}