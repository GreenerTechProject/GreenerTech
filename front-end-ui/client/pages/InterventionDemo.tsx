import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InterventionForm, { InterventionFormData } from "../components/InterventionForm";
import { Bell, Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Intervention {
  id: string;
  type: string;
  serre: string;
  date: string;
  technicien: string;
  status: "pending" | "in_progress" | "completed";
  priority: "basse" | "moyenne" | "haute" | "urgente";
  description?: string;
}

const mockInterventions: Intervention[] = [
  {
    id: "1",
    type: "Maintenance préventive",
    serre: "Serre Nord A",
    date: "2024-12-20",
    technicien: "Jean Dupont",
    status: "pending",
    priority: "moyenne",
    description: "Contrôle système irrigation"
  },
  {
    id: "2", 
    type: "Réparation",
    serre: "Serre Sud B",
    date: "2024-12-18",
    technicien: "Marie Martin",
    status: "in_progress",
    priority: "haute",
    description: "Réparation capteur température"
  },
];

export default function InterventionDemo() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>(mockInterventions);

  const handleSubmitIntervention = (data: InterventionFormData) => {
    const newIntervention: Intervention = {
      id: Date.now().toString(),
      type: data.typeIntervention,
      serre: data.idSerre,
      date: data.dateIntervention,
      technicien: data.fonctionnaireId,
      status: "pending",
      priority: data.priorite,
      description: data.description,
    };

    setInterventions(prev => [newIntervention, ...prev]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "in_progress":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminé";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "basse":
        return "bg-gray-100 text-gray-700";
      case "moyenne":
        return "bg-blue-100 text-blue-700";
      case "haute":
        return "bg-orange-100 text-orange-700";
      case "urgente":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Bell className="h-8 w-8 text-blue-600" />
                <span>Gestion des Interventions</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez vos demandes d'intervention avec notre interface moderne et intuitive
              </p>
            </div>
            
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-12 px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle Intervention
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{interventions.length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {interventions.filter(i => i.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {interventions.filter(i => i.status === "in_progress").length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {interventions.filter(i => i.status === "completed").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interventions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Interventions Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(intervention.status)}
                        <h3 className="font-semibold text-gray-900">{intervention.type}</h3>
                        <Badge className={getPriorityColor(intervention.priority)}>
                          {intervention.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Serre:</span>
                          <p className="font-medium">{intervention.serre}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <p className="font-medium">
                            {new Date(intervention.date).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Technicien:</span>
                          <p className="font-medium">{intervention.technicien}</p>
                        </div>
                      </div>
                      
                      {intervention.description && (
                        <div className="mt-3">
                          <span className="text-gray-600 text-sm">Description:</span>
                          <p className="text-sm text-gray-700 mt-1">{intervention.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="ml-4">
                      {getStatusLabel(intervention.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {interventions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune intervention pour le moment</p>
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Créer votre première intervention
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Intervention Form Modal */}
        <InterventionForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSubmitIntervention}
        />
      </div>
    </div>
  );
}
