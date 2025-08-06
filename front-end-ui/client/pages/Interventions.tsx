import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, MapPin, User, SlidersHorizontal } from "lucide-react";
import InterventionForm from "@/components/InterventionForm";

interface Intervention {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  date: string;
  location: string;
  technician: string;
  priority: "low" | "medium" | "high";
}

const mockInterventions: Intervention[] = [
  {
    id: "1",
    title: "Maintenance système irrigation",
    description: "Vérification et maintenance du système d'irrigation de la serre A",
    status: "pending",
    date: "2024-08-10",
    location: "Serre A - Zone Nord",
    technician: "Jean Dupont",
    priority: "medium"
  },
  {
    id: "2",
    title: "Contrôle phytosanitaire",
    description: "Inspection des plants pour détecter d'éventuelles maladies",
    status: "in-progress",
    date: "2024-08-08",
    location: "Serre B - Zone Sud",
    technician: "Marie Martin",
    priority: "high"
  },
  {
    id: "3",
    title: "Réparation ventilation",
    description: "Réparation du système de ventilation défaillant",
    status: "completed",
    date: "2024-08-05",
    location: "Serre C - Zone Est",
    technician: "Pierre Durand",
    priority: "high"
  }
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800"
};

const Interventions: React.FC = () => {
  const [interventions] = useState<Intervention[]>(mockInterventions);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInterventions = interventions.filter(intervention => {
    const matchesSearch = intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intervention.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || intervention.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Interventions</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle intervention
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher une intervention..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in-progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      {/* Interventions List */}
      <div className="grid gap-4">
        {filteredInterventions.map((intervention) => (
          <Card key={intervention.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{intervention.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={statusColors[intervention.status]}>
                    {intervention.status === "pending" && "En attente"}
                    {intervention.status === "in-progress" && "En cours"}
                    {intervention.status === "completed" && "Terminée"}
                    {intervention.status === "cancelled" && "Annulée"}
                  </Badge>
                  <Badge className={priorityColors[intervention.priority]}>
                    {intervention.priority === "low" && "Basse"}
                    {intervention.priority === "medium" && "Moyenne"}
                    {intervention.priority === "high" && "Haute"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{intervention.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(intervention.date).toLocaleDateString("fr-FR")}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {intervention.location}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {intervention.technician}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInterventions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucune intervention trouvée</p>
        </div>
      )}
    </div>
  );
};

export default Interventions;
