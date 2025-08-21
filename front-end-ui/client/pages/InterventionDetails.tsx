import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  BarChart3,
} from "lucide-react";

interface Intervention {
  id: number;
  type: string;
  description?: string;
  id_serre: number;
  serre_nom: string;
  domaine_nom: string;
  bilan_trimestre: string;
  statut: string;
  actions: string;
  date_creation: string;
  date_modification: string;
  technicien?: string;
  priorite?: string;
  notes?: string;
}

export default function InterventionDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInterventionDetails(parseInt(id));
    }
  }, [id]);

  const loadInterventionDetails = async (interventionId: number) => {
    try {
      setLoading(true);
      const { InterventionService } = await import("../services/interventionService");
      const data = await InterventionService.getIntervention(interventionId);
      const normalized: Intervention = {
        id: data.id,
        type: data.type_nom || data.type_tache || "Intervention",
        description: data.description,
        id_serre: data.id_serre,
        serre_nom: data.serre_nom || "",
        domaine_nom: data.domaine_nom || "",
        bilan_trimestre: "",
        statut: data.status || (data.valid ? "Validée" : "En cours"),
        actions: data.valid ? "Validée" : "",
        date_creation: data.created_at || "",
        date_modification: data.updated_at || "",
        technicien: data.technician_name,
        priorite: undefined,
        notes: undefined,
      };
      setIntervention(normalized);
    } catch (err) {
      console.error("Error loading intervention details:", err);
      setError("Erreur lors du chargement des détails de l'intervention");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "terminé":
        return { label: status, color: "bg-green-100 text-green-800 border-green-300" };
      case "en cours":
        return { label: status, color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case "programmé":
        return { label: status, color: "bg-blue-100 text-blue-800 border-blue-300" };
      case "en attente":
        return { label: status, color: "bg-gray-100 text-gray-800 border-gray-300" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "élevée":
        return { label: priority, color: "bg-red-100 text-red-800 border-red-300" };
      case "moyenne":
        return { label: priority, color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
      case "faible":
        return { label: priority, color: "bg-green-100 text-green-800 border-green-300" };
      default:
        return { label: priority || "Non définie", color: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails de l'intervention...</p>
        </div>
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {error || "Intervention non trouvée"}
          </h3>
          <p className="text-gray-600 mb-4">
            {error || "L'intervention demandée n'existe pas ou n'est pas accessible."}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Intervention #{intervention.id}
              </h1>
              <p className="text-gray-600">
                Détails de l'intervention {intervention.type}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={getStatusBadge(intervention.statut).color}
              >
                {getStatusBadge(intervention.statut).label}
              </Badge>
              <Badge
                variant="outline"
                className={getPriorityBadge(intervention.priorite).color}
              >
                {getPriorityBadge(intervention.priorite).label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Intervention Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[#B4CC5F]" />
                  Détails de l'intervention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type d'intervention</label>
                    <p className="text-gray-900 font-medium">{intervention.type}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Actions</label>
                    <p className="text-gray-900">{intervention.actions}</p>
                  </div>
                  
                  {intervention.description && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900">{intervention.description}</p>
                    </div>
                  )}
                  
                  {intervention.notes && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-gray-900">{intervention.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Serre and Domain Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Serre</label>
                    <p className="text-gray-900 font-medium">{intervention.serre_nom}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Domaine</label>
                    <p className="text-gray-900">{intervention.domaine_nom}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bilan trimestre</label>
                    <p className="text-gray-900">{intervention.bilan_trimestre}</p>
                  </div>
                  
                  {intervention.technicien && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Technicien assigné</label>
                      <p className="text-gray-900">{intervention.technicien}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Chronologie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-[#B4CC5F] rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Création</p>
                      <p className="text-xs text-gray-500">
                        {new Date(intervention.date_creation).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dernière modification</p>
                      <p className="text-xs text-gray-500">
                        {new Date(intervention.date_modification).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Créer un rapport
                </Button>
                
                <Button className="w-full" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme terminé
                </Button>
                
                <Button className="w-full" variant="outline">
                  <Wrench className="h-4 w-4 mr-2" />
                  Modifier l'intervention
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
