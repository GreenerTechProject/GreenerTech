import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InterventionForm from "../components/InterventionForm";
import TechnicianSidebar from "../components/TechnicianSidebar";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function Interventions() {
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const { user } = useAuth();

  const handleInterventionSubmit = (data: any) => {
    console.log("Intervention submitted:", data);
    // TODO: Send to backend API
    setIsInterventionFormOpen(false);
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention saved as draft:", data);
    // TODO: Save draft to backend or local storage
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug info */}
      <div className="fixed top-0 right-0 bg-red-500 text-white p-2 z-50">
        Modal Open: {isInterventionFormOpen ? 'Yes' : 'No'}
      </div>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar
                userRole={(user?.role === "technicien_sup" ? "technicien_sup" : "technicien") as "technicien" | "technicien_sup"}
                onInterventionClick={() => setIsInterventionFormOpen(true)}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
                <p className="text-sm text-gray-600">Gérez vos interventions</p>
              </div>
            </div>
            
            {/* Add Intervention Button */}
            <Button
              size="sm"
              className="bg-[#B4CC5F] hover:bg-[#A3C247] text-white"
              onClick={() => {
                console.log("Header button clicked");
                setIsInterventionFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle intervention
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interventions List Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Plus className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intervention</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première intervention.
            </p>
            <div className="mt-6">
              <Button
                size="sm"
                className="bg-[#B4CC5F] hover:bg-[#A3C247] text-white"
                onClick={() => {
                  console.log("Center button clicked");
                  setIsInterventionFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle intervention
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={handleInterventionSaveDraft}
      />

      <PageHeader
        title="Interventions"
        badge={{
          text: `${filteredInterventions.length} intervention${filteredInterventions.length !== 1 ? 's' : ''}`,
          className: "bg-blue-50 border-blue-200 text-blue-700"
        }}
        userRole="technicien"
      />

      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Search and Filters Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <span>Recherche et Filtres</span>
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </Button>
                <Button size="sm" className="bg-[#B4CC5F] hover:bg-[#A3C247]">
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle intervention
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par titre, description, serre ou technicien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              {/* Filter Grid - Responsive */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="type-filter" className="text-sm font-medium">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interventionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority-filter" className="text-sm font-medium">Priorité</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger id="priority-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-filter" className="text-sm font-medium">Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serre-filter" className="text-sm font-medium">Serre</Label>
                  <Select value={serreFilter} onValueChange={setSerreFilter}>
                    <SelectTrigger id="serre-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les serres</SelectItem>
                      {uniqueSerres.map((serre) => (
                        <SelectItem key={serre} value={serre}>
                          {serre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignee-filter" className="text-sm font-medium">Technicien</Label>
                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger id="assignee-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les techniciens</SelectItem>
                      {uniqueAssignees.map((assignee) => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interventions List */}
        <div className="space-y-4">
          {filteredInterventions.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune intervention trouvée
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune intervention ne correspond à vos critères de recherche.
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Effacer les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredInterventions.map((intervention) => (
              <Card key={intervention.id} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {intervention.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getTypeColor(intervention.type))}
                          >
                            {getTypeLabel(intervention.type)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getPriorityColor(intervention.priority))}
                          >
                            {getPriorityLabel(intervention.priority)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {intervention.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs flex items-center space-x-1", getStatusColor(intervention.status))}
                        >
                          {getStatusIcon(intervention.status)}
                          <span>{getStatusLabel(intervention.status)}</span>
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Details Grid - Responsive */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Assigné à:</span>
                          <p className="font-medium text-gray-900">{intervention.assignedTo}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Localisation:</span>
                          <p className="font-medium text-gray-900">{intervention.serre}</p>
                          <p className="text-gray-600 text-xs">{intervention.location}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Programmée:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(intervention.scheduledDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <span className="text-gray-500">Durée:</span>
                          <p className="font-medium text-gray-900">
                            {intervention.actualDuration 
                              ? `${intervention.actualDuration}min (réel)`
                              : `${intervention.estimatedDuration}min (estimé)`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Equipment and Notes */}
                    {(intervention.equipment.length > 0 || intervention.notes) && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          {intervention.equipment.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Équipement requis:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {intervention.equipment.map((item, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {intervention.notes && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Notes:</span>
                              <p className="text-sm text-gray-600 mt-1">{intervention.notes}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        Voir détails
                      </Button>
                      {intervention.status === "pending" && (
                        <Button size="sm" className="bg-[#B4CC5F] hover:bg-[#A3C247]">
                          Commencer
                        </Button>
                      )}
                      {intervention.status === "in_progress" && (
                        <>
                          <Button size="sm" variant="outline">
                            Mettre en pause
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            Terminer
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-gray-600">
                        Modifier
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
