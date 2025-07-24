import React from 'react';
import { AppLayout } from '../layout';

const NavigationDemo: React.FC = () => {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Navigation Demo
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Main Navigation Features
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Fixed position sidebar taking full page height
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Clear and viewable at all times
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Exact design matching from the provided specifications
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Responsive design that adapts to different screen sizes
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                User profile section with avatar and role
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Logout functionality
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Navigation Items
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Map</h3>
                <p className="text-sm text-gray-600">
                  Geographic view and mapping functionality
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Surveillance</h3>
                <p className="text-sm text-gray-600">
                  Monitoring and surveillance tools
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Alertes</h3>
                <p className="text-sm text-gray-600">
                  Alert management and notifications
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Interventions</h3>
                <p className="text-sm text-gray-600">
                  Intervention tracking and management
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Rapports</h3>
                <p className="text-sm text-gray-600">
                  Reports and documentation
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Usage Instructions
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>The navigation sidebar is always visible on the left side</li>
              <li>Click on any navigation item to interact with it</li>
              <li>The sidebar maintains its position across all pages</li>
              <li>User profile and logout are accessible at the bottom</li>
              <li>The design matches the exact specifications provided</li>
            </ol>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NavigationDemo;
