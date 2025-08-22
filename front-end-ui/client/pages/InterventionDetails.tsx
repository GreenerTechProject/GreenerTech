import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TechnicianLayout from "../components/TechnicianLayout";
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
  Bell,
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
  const [notificationId, setNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadInterventionDetails(parseInt(id));
    }
    
    // Get notification ID from URL params if present
    const notifId = searchParams.get('notificationId');
    if (notifId) {
      setNotificationId(notifId);
    }
  }, [id, searchParams]);

  const loadInterventionDetails = async (interventionId: number) => {
    try {
      setLoading(true);
      const { InterventionService } = await import("../services/interventionService");
      const data = await InterventionService.getIntervention(interventionId);
      
      // Map the status properly based on the API response
      let status = "En cours";
      if (data.status) {
        status = data.status;
      } else if (data.valid === true) {
        status = "Validée";
      } else if (data.valid === false) {
        status = "Rejetée";
      }
      
      const normalized: Intervention = {
        id: data.id,
        type: data.type_nom || data.type_tache || "Intervention",
        description: data.description,
        id_serre: data.id_serre,
        serre_nom: data.serre_nom || "",
        domaine_nom: data.domaine_nom || "",
        bilan_trimestre: "",
        statut: status,
        actions: data.valid === true ? "Validée" : data.valid === false ? "Rejetée" : "",
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
      case "validée":
        return { label: status, color: "bg-green-100 text-green-800 border-green-300" };
      case "rejetée":
        return { label: status, color: "bg-red-100 text-red-800 border-red-300" };
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
    <TechnicianLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          {/* Notification Banner */}
          {notificationId && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">
                    Notification d'intervention
                  </h3>
                  <p className="text-sm text-blue-700">
                    Vous consultez cette intervention suite à une notification de votre superviseur
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/technician/notifications')}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  Voir toutes les notifications
                </Button>
              </div>
            </div>
          )}
          
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
              {intervention.actions && (
                <Badge
                  variant="outline"
                  className={intervention.actions === "Validée" ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}
                >
                  {intervention.actions}
                </Badge>
              )}
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

            {/* Supervisor Decision Information */}
            {intervention.actions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Décision du superviseur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Statut de la demande</label>
                      <p className="text-gray-900 font-medium">
                        {intervention.actions === "Validée" ? "✅ Demande approuvée" : "❌ Demande rejetée"}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date de la décision</label>
                      <p className="text-gray-900">
                        {intervention.date_modification ? 
                          new Date(intervention.date_modification).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "Non disponible"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {intervention.actions === "Validée" && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Votre demande d'intervention a été validée par votre superviseur.</strong> 
                        Vous pouvez maintenant procéder à l'exécution de cette intervention.
                      </p>
                    </div>
                  )}
                  
                  {intervention.actions !== "Validée" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Votre demande d'intervention a été rejetée par votre superviseur.</strong> 
                        Veuillez contacter votre superviseur pour plus de détails ou soumettre une nouvelle demande.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  
                  {/* Supervisor Decision Timeline */}
                  {intervention.actions && (
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        intervention.actions === "Validée" ? "bg-green-500" : "bg-red-500"
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {intervention.actions === "Validée" ? "Validation par le superviseur" : "Rejet par le superviseur"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(intervention.date_modification).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-4 text-orange-600" />
                  Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {intervention.actions === "Validée" ? (
                  <>
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
                      Commencer l'intervention
                    </Button>
                  </>
                ) : intervention.actions && intervention.actions !== "Validée" ? (
                  <>
                    <Button className="w-full" variant="outline">
                      <Wrench className="h-4 w-4 mr-2" />
                      Modifier et resoumettre
                    </Button>
                    
                    <Button className="w-full" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Contacter le superviseur
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TechnicianLayout>
  );
}
