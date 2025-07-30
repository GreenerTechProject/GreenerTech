import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

export default function TechnicianStep({ technician, setTechnician, setStep, onSkip }) {
    const navigate = useNavigate();
    
  const handleChange = (field, value) => {
    setTechnician({ ...technician, [field]: value });
  };

  const handleFinish = () => {
    const { name, telephone, email, cin } = technician;
    if (!name || !telephone || !email || !cin) {
      alert("Please fill all technician fields.");
      return;
    }
    alert("Setup complete! Data ready to be submitted.");
    
  };

  const handleSkip = () => {
        navigate({ to: '/dashboard' });

  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={technician.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Technician Name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={technician.telephone}
              onChange={(e) => handleChange("telephone", e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Phone Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CIN</label>
            <input
              type="text"
              value={technician.cin}
              onChange={(e) => handleChange("cin", e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="CIN Number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={technician.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="Email Address"
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-2">
        <button
          onClick={() => setStep("serres")}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSkip}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          Skip
        </button>
        <button
          onClick={handleFinish}
          disabled={!technician.name || !technician.telephone || !technician.email || !technician.cin}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            technician.name && technician.telephone && technician.email && technician.cin
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Complete Setup
        </button>
      </div>
    </motion.div>
  );
}