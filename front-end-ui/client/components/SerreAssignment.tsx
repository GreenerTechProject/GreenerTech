import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  SkipForward, 
  ArrowRight, 
  Search, 
  Users, 
  MapPin,
  Home,
  UserCheck,
  GripVertical,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LogoutWithWarning from "./LogoutWithWarning";

interface Domain {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: Serre[];
}

interface Serre {
  id: string;
  nom: string;
  surface: number;
  domainId: string;
  guideId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guide?: {
    id: string;
    nom: string;
    variete: string;
    rendement: number;
    date_debut_saison: Date | string;
    date_fin_saison: Date | string;
    irrigationType?: string;
    notes?: string;
  };
}

interface Technician {
  id: string;
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
}

interface SerreAssignment {
  serreId: string;
  supervisorIds: string[];
}

interface SerreAssignmentProps {
  domains: Domain[];
  technicians: Technician[];
  onComplete: (assignments: SerreAssignment[]) => void;
  onBack: () => void;
  onSkip: () => void;
  initialAssignments?: SerreAssignment[];
}

export default function SerreAssignment({
  domains,
  technicians,
  onComplete,
  onBack,
  onSkip,
  initialAssignments = [],
}: SerreAssignmentProps) {
  const [assignments, setAssignments] = useState<SerreAssignment[]>(initialAssignments);
  const [searchTerm, setSearchTerm] = useState("");
  const [leftPanelWidth, setLeftPanelWidth] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  // Get all serres from all domains
  const allSerres = useMemo(() => {
    return domains.flatMap(domain => 
      domain.serres.map(serre => ({
        ...serre,
        domainName: domain.name
      }))
    );
  }, [domains]);

  // Filter technicians to only show Technicien Sup (supervisors)
  const supervisorTechnicians = useMemo(() => {
    return technicians.filter(t => t.role === "technicien_superieur");
  }, [technicians]);

  // Filter serres based on search
  const filteredSerres = useMemo(() => {
    if (!searchTerm) return allSerres;
    return allSerres.filter(serre => 
      serre.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serre.domainName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSerres, searchTerm]);

  // Filter technicians based on search (only supervisors)
  const filteredTechnicians = useMemo(() => {
    if (!searchTerm) return supervisorTechnicians;
    return supervisorTechnicians.filter(tech => 
      tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supervisorTechnicians, searchTerm]);

  const handleAssignmentChange = (serreId: string, technicianId: string, checked: boolean) => {
    setAssignments(prev => {
      const existingAssignment = prev.find(a => a.serreId === serreId);
      
      if (existingAssignment) {
        if (checked) {
          // Add technician to existing assignment
          return prev.map(a => 
            a.serreId === serreId 
              ? { ...a, supervisorIds: [...a.supervisorIds, technicianId] }
              : a
          );
        } else {
          // Remove technician from existing assignment
          return prev.map(a => 
            a.serreId === serreId 
              ? { ...a, supervisorIds: a.supervisorIds.filter(id => id !== technicianId) }
              : a
          );
        }
      } else if (checked) {
        // Create new assignment
        return [...prev, { serreId, supervisorIds: [technicianId] }];
      }
      
      return prev;
    });
  };

  const getAssignmentForSerre = (serreId: string): SerreAssignment | undefined => {
    return assignments.find(a => a.serreId === serreId);
  };

  const isTechnicianAssignedToSerre = (serreId: string, technicianId: string): boolean => {
    const assignment = getAssignmentForSerre(serreId);
    return assignment ? assignment.supervisorIds.includes(technicianId) : false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newWidth = e.clientX;
      if (newWidth > 250 && newWidth < 1200) {
        setLeftPanelWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleContinue = () => {
    onComplete(assignments);
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Panel - Responsive */}
      <div 
        className="w-full lg:bg-white lg:border-r flex flex-col transition-all duration-200"
        style={{ width: isFullscreen ? '100%' : (window.innerWidth < 1024 ? '100%' : `${leftPanelWidth}px`) }}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Assignation des Serres</h2>
              <p className="text-sm text-gray-600 hidden sm:block">
                Assignez les serres aux Techniciens Supérieurs uniquement
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Note: Seuls les Techniciens Supérieurs peuvent être assignés aux serres
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LogoutWithWarning variant="outline" size="sm" />
              <Button
                variant="outline"
                onClick={() => setIsFullscreen(!isFullscreen)}
                size="sm"
                className="hidden lg:flex"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={onBack} size="sm" className="lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onBack} className="hidden lg:flex">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 lg:p-6 border-b bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des serres ou techniciens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-white">
          <div className="space-y-6">
            {/* Serres Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Home className="h-4 w-4" />
                  Serres ({filteredSerres.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSerres.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchTerm ? `Aucune serre trouvée pour "${searchTerm}"` : "Aucune serre disponible"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredSerres.map((serre) => (
                      <div key={serre.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm lg:text-base">{serre.nom}</h4>
                            <p className="text-xs lg:text-sm text-gray-600">
                              Domaine: {serre.domainName} • {serre.surface.toFixed(2)} m²
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getAssignmentForSerre(serre.id)?.supervisorIds.length || 0} assigné(s)
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Techniciens Supérieurs assignés:</Label>
                          {filteredTechnicians.map((tech) => (
                            <div key={tech.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${serre.id}-${tech.id}`}
                                checked={isTechnicianAssignedToSerre(serre.id, tech.id)}
                                onCheckedChange={(checked) => 
                                  handleAssignmentChange(serre.id, tech.id, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={`${serre.id}-${tech.id}`} 
                                className="text-sm cursor-pointer flex-1"
                              >
                                {tech.fullName}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Technicians Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Users className="h-4 w-4" />
                  Techniciens Supérieurs ({filteredTechnicians.length})
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Seuls les Techniciens Supérieurs peuvent être assignés aux serres
                </p>
              </CardHeader>
              <CardContent>
                {filteredTechnicians.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchTerm ? `Aucun technicien trouvé pour "${searchTerm}"` : "Aucun technicien supérieur disponible"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredTechnicians.map((tech) => {
                      const assignedSerres = assignments.filter(a => 
                        a.supervisorIds.includes(tech.id)
                      );
                      
                      return (
                        <div key={tech.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{tech.fullName}</h4>
                              <p className="text-xs text-gray-600">{tech.email}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {assignedSerres.length} serre(s)
                            </Badge>
                          </div>
                          
                          {assignedSerres.length > 0 && (
                            <div className="text-xs text-gray-600">
                              Serres: {assignedSerres.map(a => {
                                const serre = allSerres.find(s => s.id === a.serreId);
                                return serre?.nom;
                              }).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t bg-gray-50">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="text-sm text-gray-600 text-center lg:text-left">
              {assignments.length} assignation(s) configurée(s)
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex items-center gap-2 flex-1 lg:flex-none bg-green-50 border-green-200 text-[#2E7D32] hover:bg-green-100"
                size="sm"
              >
                <SkipForward className="h-4 w-4" />
                <span className="hidden sm:inline">Continuer / Ignorer</span>
                <span className="sm:hidden">Ignorer</span>
              </Button>
              <Button
                onClick={handleContinue}
                className="flex items-center gap-2 flex-1 lg:flex-none"
                size="sm"
              >
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Skip Information */}
          <div className="mt-3 text-center lg:text-left">
            <p className="text-xs text-gray-500">
              Vous pouvez ignorer cette étape et configurer les assignations plus tard depuis le tableau de bord
            </p>
          </div>
        </div>
      </div>

      {/* Resizable Handle */}
      {!isFullscreen && (
        <div
          className="hidden lg:block w-1 bg-gray-200 cursor-col-resize hover:bg-gray-300 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="w-full h-full flex items-center justify-center">
            <GripVertical className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      )}

      {/* Right Panel - Preview */}
      {!isFullscreen && (
        <div className="flex-1 hidden lg:block bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Aperçu des Assignations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Vue d'ensemble de la configuration des serres et techniciens
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="hidden lg:flex"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Plein écran
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune assignation</h4>
                  <p className="text-gray-600">
                    Commencez par assigner des serres aux techniciens supérieurs
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const serre = allSerres.find(s => s.id === assignment.serreId);
                    const assignedTechs = technicians.filter(t => 
                      assignment.supervisorIds.includes(t.id)
                    );
                    
                    return (
                      <Card key={assignment.serreId}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            {serre?.nom}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              Domaine: {serre?.domainName}
                            </p>
                            <div>
                              <p className="text-sm font-medium mb-2">Techniciens assignés:</p>
                              <div className="space-y-1">
                                {assignedTechs.map((tech) => (
                                  <div key={tech.id} className="flex items-center gap-2">
                                    <UserCheck className="h-3 w-3 text-green-500" />
                                    <span className="text-sm">{tech.fullName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Aperçu des Assignations - Plein écran</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Vue d'ensemble de la configuration des serres et techniciens
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(false)}
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Réduire
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune assignation</h4>
                  <p className="text-gray-600">
                    Commencez par assigner des serres aux techniciens supérieurs
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assignments.map((assignment) => {
                    const serre = allSerres.find(s => s.id === assignment.serreId);
                    const assignedTechs = technicians.filter(t => 
                      assignment.supervisorIds.includes(t.id)
                    );
                    
                    return (
                      <Card key={assignment.serreId} className="h-fit">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            {serre?.nom}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              Domaine: {serre?.domainName}
                            </p>
                            <div>
                              <p className="text-sm font-medium mb-2">Techniciens assignés:</p>
                              <div className="space-y-1">
                                {assignedTechs.map((tech) => (
                                  <div key={tech.id} className="flex items-center gap-2">
                                    <UserCheck className="h-3 w-3 text-green-500" />
                                    <span className="text-sm">{tech.fullName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

