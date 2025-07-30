const Step2_CompanyInfo = ({ formData, onChange, onBack, onNext }) => (
  <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
    <h2 className="text-xl font-semibold mb-4 text-center">Informations sur l'entreprise</h2>

    <input
      name="companyName"
      value={formData.companyName}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Nom de l’entreprise"
    />
    <input
      name="legalStatus"
      value={formData.legalStatus}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Statut juridique"
    />
    <input
      name="address"
      value={formData.address}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Adresse"
    />
    <input
      name="companyId"
      value={formData.companyId}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Identifiant de l’entreprise"
    />
    <input
      name="companyEmail"
      value={formData.companyEmail}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Email de l’entreprise"
    />

    <div className="flex justify-between">
      <button onClick={onBack} className="bg-gray-300 px-4 py-2 rounded">
        Retour
      </button>
      <button onClick={onNext} className="bg-blue-600 text-white px-4 py-2 rounded">
        Continuer
      </button>
    </div>
  </div>
);
export default Step2_CompanyInfo;
