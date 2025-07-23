const Step3_FinalStep = ({ allFormData, onBack, onSubmit }) => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-center">Résumé des informations</h2>
      <div className="text-sm space-y-2">
        <p><strong>Nom complet:</strong> {allFormData.fullName}</p>
        <p><strong>Email:</strong> {allFormData.email}</p>
        <p><strong>Identifiant:</strong> {allFormData.username}</p>
        <hr />
        <p><strong>Nom entreprise:</strong> {allFormData.companyName}</p>
        <p><strong>Statut juridique:</strong> {allFormData.legalStatus}</p>
        <p><strong>Adresse:</strong> {allFormData.address}</p>
        <p><strong>ID entreprise:</strong> {allFormData.companyId}</p>
        <p><strong>Email entreprise:</strong> {allFormData.companyEmail}</p>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
        >
          Retour
        </button>

        <button
          type="button"
          onClick={onSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Compléter l’inscription
        </button>
      </div>
    </div>
  );
};

export default Step3_FinalStep;
