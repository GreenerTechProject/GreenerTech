import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SerresStep({
  domainName,
  serres,
  setSerres,
  currentSerreIndex,
  setCurrentSerreIndex,
  setStep
}) {
  const [serreName, setSerreName] = useState("");
  const [guide, setGuide] = useState({
    nom: "",
    rendement: "",
    variete: "",
    date_debut_saison: "",
    date_fin_saison: "",
    nombre_de_plants: ""
  });

  const handleAddSerre = () => {
    if (!serreName) return alert("Enter a greenhouse name");
    if (!guide.nom || !guide.date_debut_saison || !guide.date_fin_saison || !guide.nombre_de_plants) {
      return alert("Please complete the cultivation guide");
    }
    const newSerre = {
      name: serreName,
      polygon: [],
      guideCulture: guide
    };
    const updatedSerres = [...serres, newSerre];
    setSerres(updatedSerres);
    setCurrentSerreIndex(updatedSerres.length - 1);
    setSerreName("");
    setGuide({
      nom: "",
      rendement: "",
      variete: "",
      date_debut_saison: "",
      date_fin_saison: "",
      nombre_de_plants: ""
    });
  };

  const handleContinue = () => {
    if (!serres.length) return alert("Add at least one greenhouse");
    const incomplete = serres.some((s) => s.polygon.length === 0);
    if (incomplete) return alert("Each greenhouse needs a defined area");
    setStep("technician");
  };

  const handleGuideChange = (field, value) => {
    setGuide({ ...guide, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Domain</h3>
          <h2 className="text-lg font-semibold text-gray-800">{domainName}</h2>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          {serres.length} {serres.length === 1 ? 'Greenhouse' : 'Greenhouses'}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Greenhouse Name</label>
          <input
            value={serreName}
            onChange={(e) => setSerreName(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            placeholder="e.g. Tomato Greenhouse"
          />
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Cultivation Guide
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Crop Name</label>
              <input
                type="text"
                value={guide.nom}
                onChange={(e) => handleGuideChange("nom", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                placeholder="Tomato, Lettuce, etc."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Yield (kg/ha)</label>
              <input
                type="number"
                value={guide.rendement}
                onChange={(e) => handleGuideChange("rendement", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                placeholder="Estimated yield"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Variety</label>
              <input
                type="text"
                value={guide.variete}
                onChange={(e) => handleGuideChange("variete", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                placeholder="Variety name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={guide.date_debut_saison}
                onChange={(e) => handleGuideChange("date_debut_saison", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={guide.date_fin_saison}
                onChange={(e) => handleGuideChange("date_fin_saison", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Number of Plants</label>
              <input
                type="number"
                value={guide.nombre_de_plants}
                onChange={(e) => handleGuideChange("nombre_de_plants", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                placeholder="Total plants"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleAddSerre}
        className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all shadow-md"
      >
        Add Greenhouse
      </button>

      {serres.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Your Greenhouses</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {serres.map((serre, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border ${currentSerreIndex === i ? 'border-green-500 bg-green-50' : 'border-gray-200'} cursor-pointer transition-all`}
                onClick={() => setCurrentSerreIndex(i)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{serre.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${serre.polygon.length ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {serre.polygon.length ? 'Area defined' : 'Needs area'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {serre.guideCulture?.nom || 'No crop specified'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-2">
        <button
          onClick={() => setStep("domain")}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!serres.length}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            serres.length
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}