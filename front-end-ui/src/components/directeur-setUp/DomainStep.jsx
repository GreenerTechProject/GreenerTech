import React from "react";
import { motion } from "framer-motion";
import api from "../../axios/api"; 


export default function DomainStep({ domainName, setDomainName, domainPolygon, setStep }) {

const handleSubmitDomain = async () => {
  if (!domainName) {
    alert("Please enter a domain name.");
    return;
  }
  if (!domainPolygon) {
    alert("Please draw the domain polygon.");
    return;
  }

  const domain = {
      nom: domainName,
      id_entreprise: localStorage.getItem('entrepriseId'), 
      position: domainPolygon
    }

  try {
    const response = await DomainService.createDomain(domain);
    const savedDomaine = response.data;

    
    if (setSavedDomaineId) {
      setSavedDomaineId(savedDomaine.id);
    }

    setStep("serres");
  } catch (error) {
    console.error("Error saving domaine:", error);
    alert("Failed to save domain. Please try again.");
  }
};


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
        <input
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="e.g. North Farm"
        />
      </div>

      {domainPolygon && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Domain area defined</span>
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-2">
        <button
          onClick={handleSubmitDomain}
          disabled={!domainName || !domainPolygon}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            domainName && domainPolygon
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
        <button
          onClick={() => setStep("technician")}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}