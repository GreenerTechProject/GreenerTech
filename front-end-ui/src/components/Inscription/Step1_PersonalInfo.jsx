const Step1_PersonalInfo = ({ formData, onChange, onNext }) => (
  <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-lg">
    <h2 className="text-xl font-semibold mb-4 text-center">Informations Personnelles</h2>

    <input
      name="fullName"
      value={formData.fullName}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Nom complet"
    />
    <input
      name="email"
      value={formData.email}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Email"
    />
    <input
      type="password"
      name="password"
      value={formData.password}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Mot de passe"
    />
    <input
      name="username"
      value={formData.username}
      onChange={onChange}
      className="w-full mb-3 p-2 border"
      placeholder="Identifiant"
    />

    <button
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full mt-4"
      onClick={onNext}
    >
      Continuer
    </button>
  </div>
);
export default Step1_PersonalInfo;
