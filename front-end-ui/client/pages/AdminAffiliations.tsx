import { useState, useEffect } from "react";
import { authService, AffiliationResponse } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

export default function AdminAffiliations() {
  const { user } = useAuth();
  const [affiliations, setAffiliations] = useState<AffiliationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role === "directeur") {
      loadAffiliations();
    }
  }, [user]);

  const loadAffiliations = async () => {
    try {
      setIsLoading(true);
      const data = await authService.getAffiliationRequests();
      setAffiliations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      await authService.updateAffiliationRequest(requestId, status);
      await loadAffiliations(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Only directors can access this page
  if (user?.role !== "directeur") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Demandes d'affiliation
          </h1>
          <p className="mt-2 text-gray-600">
            Gérez les demandes d'affiliation des techniciens
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {affiliations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Aucune demande d'affiliation trouvée
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {affiliations.map((affiliation) => (
                <li key={affiliation.requestId} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          ID: {affiliation.requestId}
                        </h3>
                        <span
                          className={`ml-4 px-2 py-1 text-xs font-medium rounded-full ${
                            affiliation.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : affiliation.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {affiliation.status === "pending" && "En attente"}
                          {affiliation.status === "approved" && "Approuvé"}
                          {affiliation.status === "rejected" && "Rejeté"}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-600">
                        {affiliation.message}
                      </p>
                    </div>

                    {affiliation.status === "pending" && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              affiliation.requestId,
                              "approved",
                            )
                          }
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(
                              affiliation.requestId,
                              "rejected",
                            )
                          }
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
