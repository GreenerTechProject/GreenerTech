import React, { useState, useEffect } from "react";
import TechHeader from "../components/TechHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  ChevronDown,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import InterventionForm from "../components/InterventionForm";

interface Intervention {
  id: number;
  type: string;
  id_serre: number;
  serre_nom: string;
  domaine_nom: string;
  bilan_trimestre: string;
  statut: string;
  actions: string;
  date_creation: string;
  date_modification: string;
}

interface InterventionType {
  id: number;
  nom: string;
  couleur: string;
  icone: string;
}

const interventionTypes: InterventionType[] = [
  { id: 1, nom: "Préparation du Sol", couleur: "bg-green-500", icone: "🌱" },
  { id: 2, nom: "Plantation", couleur: "bg-blue-500", icone: "🪴" },
  { id: 3, nom: "Palissage", couleur: "bg-orange-500", icone: "⚡" },
  { id: 4, nom: "Ébourgeonnage", couleur: "bg-purple-500", icone: "🎗️" },
  { id: 5, nom: "Effeuillage", couleur: "bg-green-600", icone: "🍃" },
  { id: 6, nom: "Éclaircissage", couleur: "bg-orange-600", icone: "🎯" }
];

interface InterventionData {
  interventionType: string;
  serreId: string;
  interventionDate: string;
  functionary: string;
  description: string;
  priority: "basse" | "moyenne" | "haute" | "urgente";
}

export default function Interventions() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filteredInterventions, setFilteredInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [interventionsPerPage] = useState(7);
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);

  useEffect(() => {
    loadInterventions();
  }, []);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      // Mock data for now - in real implementation, fetch from backend
      const mockInterventions: Intervention[] = [
        {
          id: 1,
          type: "Préparation du Sol",
          id_serre: 1,
          serre_nom: "Serre A1",
          domaine_nom: "Domaine Nord",
          bilan_trimestre: "Bilan Q1",
          statut: "Terminé",
          actions: "Programmé",
          date_creation: "2024-01-15",
          date_modification: "2024-01-20"
        },
        {
          id: 2,
          type: "Plantation",
          id_serre: 2,
          serre_nom: "Serre B2",
          domaine_nom: "Domaine Sud",
          bilan_trimestre: "Bilan Q2",
          statut: "En cours",
          actions: "Demande",
          date_creation: "2024-01-18",
          date_modification: "2024-01-22"
        },
        {
          id: 3,
          type: "Palissage",
          id_serre: 3,
          serre_nom: "Serre C3",
          domaine_nom: "Domaine Est",
          bilan_trimestre: "Bilan Q1",
          statut: "Terminé",
          actions: "Demande",
          date_creation: "2024-01-20",
          date_modification: "2024-01-25"
        },
        {
          id: 4,
          type: "Ébourgeonnage",
          id_serre: 4,
          serre_nom: "Serre D4",
          domaine_nom: "Domaine Ouest",
          bilan_trimestre: "Bilan Q3",
          statut: "En cours",
          actions: "Programmé",
          date_creation: "2024-01-22",
          date_modification: "2024-01-26"
        },
        {
          id: 5,
          type: "Effeuillage",
          id_serre: 5,
          serre_nom: "Serre E5",
          domaine_nom: "Domaine Central",
          bilan_trimestre: "Bilan Q2",
          statut: "Terminé",
          actions: "Programmé",
          date_creation: "2024-01-25",
          date_modification: "2024-01-28"
        },
        {
          id: 6,
          type: "Éclaircissage",
          id_serre: 6,
          serre_nom: "Serre F6",
          domaine_nom: "Domaine Nord",
          bilan_trimestre: "Bilan Q4",
          statut: "En cours",
          actions: "Programmé",
          date_creation: "2024-01-28",
          date_modification: "2024-01-30"
        }
      ];

      setInterventions(mockInterventions);
      setFilteredInterventions(mockInterventions);
    } catch (error) {
      console.error("Error loading interventions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    
    if (!value.trim()) {
      setFilteredInterventions(interventions);
    } else {
      const filtered = interventions.filter(intervention =>
        intervention.type.toLowerCase().includes(value.toLowerCase()) ||
        intervention.serre_nom.toLowerCase().includes(value.toLowerCase()) ||
        intervention.domaine_nom.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredInterventions(filtered);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSubmitIntervention = (data: InterventionData) => {
    console.log("Intervention submitted:", data);
    // Here you would typically send the data to your backend
    // For now, we'll just close the form
    setIsInterventionFormOpen(false);
  };

  const handleSaveDraft = (data: InterventionData) => {
    console.log("Intervention draft saved:", data);
    // Here you would typically save the draft to your backend
    // For now, we'll just close the form
    setIsInterventionFormOpen(false);
  };

  const getInterventionTypeIcon = (typeName: string) => {
    const type = interventionTypes.find(t => t.nom === typeName);
    if (!type) return "📋";
    
    return (
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", type.couleur)}>
        <span className="text-sm">{type.icone}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "Terminé") {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Terminé</Badge>;
    } else if (status === "En cours") {
      return <Badge className="bg-red-500 text-white">En cours</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">{status}</Badge>;
  };

  const getActionBadge = (action: string) => {
    if (action === "Programmé") {
      return <Badge className="bg-green-500 text-white">Programmé</Badge>;
    } else if (action === "Demande") {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Demande</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">{action}</Badge>;
  };

  const totalPages = Math.ceil(filteredInterventions.length / interventionsPerPage);
  const startIndex = (currentPage - 1) * interventionsPerPage;
  const endIndex = startIndex + interventionsPerPage;
  const currentInterventions = filteredInterventions.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role="technicien" />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Interventions
          </h1>
          <p className="text-gray-600 text-lg">
            Suivi et gestion des interventions entre superviseurs et techniciens
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher une Intervention..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              Trier par
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => setIsInterventionFormOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Demande une intervention
            </Button>
          </div>
        </div>

        {/* Interventions Table */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Interventions ({filteredInterventions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type d'intervention</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID Serre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentInterventions.map((intervention) => (
                    <tr key={intervention.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {getInterventionTypeIcon(intervention.type)}
                          <span className="text-sm font-medium text-gray-900">{intervention.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {intervention.serre_nom} / {intervention.domaine_nom} / {intervention.bilan_trimestre}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {getStatusBadge(intervention.statut)}
                          {intervention.statut === "En cours" && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Terminé</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getActionBadge(intervention.actions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={cn(
                  page === currentPage
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Intervention Form Dialog */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleSubmitIntervention}
        onSaveDraft={handleSaveDraft}
      />
    </div>
  );
}
