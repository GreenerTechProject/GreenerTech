import React, { useState } from "react";

export default function EntrepriseStep({ setStep, setEntrepriseId, onSkip }) {
  const [formData, setFormData] = useState({
    nom: "",
    status_juridique: "",
    adresse: "",
    id_fiscale: "",
    id_nationale: "",
    email: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    const requiredFields = ["nom", "adresse", "email"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Please fill in: ${field}`);
        return;
      }
    }

    try {
      const response = await fetch("/api/entreprise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!data?.id) {
        alert("Failed to save entreprise.");
        return;
      }

      setEntrepriseId(data.id);
      setStep("domain");
    } catch (err) {
      console.error("Failed to save entreprise:", err);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-2">Add Entreprise Info</h3>

      <input
        name="nom"
        placeholder="Nom de l'entreprise"
        value={formData.nom}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="status_juridique"
        placeholder="Statut juridique"
        value={formData.status_juridique}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="adresse"
        placeholder="Adresse"
        value={formData.adresse}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="id_fiscale"
        placeholder="Identifiant fiscal"
        value={formData.id_fiscale}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="id_nationale"
        placeholder="Identifiant national"
        value={formData.id_nationale}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <input
        name="email"
        type="email"
        placeholder="Adresse email"
        value={formData.email}
        onChange={handleChange}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={handleSubmit}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save and Continue
      </button>
        <button
        onClick={onSkip}
        className="mt-4 text-sm text-blue-600 hover:underline"
      >
        Skip this step
      </button>
    </div>
  );
}
