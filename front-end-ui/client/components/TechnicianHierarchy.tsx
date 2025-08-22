import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  UserCheck,
  UserPlus,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Minimize2,
  Maximize2,
  Trash2,
  Loader2,
} from "lucide-react";
import { technicianService, Technician } from "@/services/technicianService";
import { assignmentService } from "@/services/assignmentService";

interface TechnicianHierarchyProps {
  technicians: Technician[];
  onComplete: (technicians: Technician[]) => void;
  onBack: () => void;
  onSkip: () => void;
  companyId?: number;
}

export default function TechnicianHierarchy({
  technicians: initialTechnicians,
  onComplete,
  onBack,
  onSkip,
  companyId,
}: TechnicianHierarchyProps) {
  const [updatedTechnicians, setUpdatedTechnicians] = useState<Technician[]>(initialTechnicians);
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>(initialTechnicians);
  const [searchTerm, setSearchTerm] = useState("");
  const [leftPanelWidth, setLeftPanelWidth] = useState(400);
  const [isDragging, setIsDragging] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1024);
  const [expandedSupervisors, setExpandedSupervisors] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render

  // Get window width safely
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };
    
    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    
    return () => window.removeEventListener('resize', updateWindowWidth);
  }, []);

  // Fetch technicians effect
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!companyId) {
        setAllTechnicians(initialTechnicians);
        setUpdatedTechnicians(initialTechnicians);
        return;
      }

      setIsLoading(true);
      try {
        const fetchedTechnicians = await technicianService.getAllTechniciansByCompany(companyId);
        setAllTechnicians(fetchedTechnicians);
        
        const mergedTechnicians = fetchedTechnicians.map(fetched => {
          const initial = initialTechnicians.find(init => init.id === fetched.id);
          return initial ? { ...fetched, ...initial } : fetched;
        });
        
        setUpdatedTechnicians(mergedTechnicians);
      } catch (error) {
        setAllTechnicians(initialTechnicians);
        setUpdatedTechnicians(initialTechnicians);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicians();
  }, [companyId, initialTechnicians]);

  // Computed values - must be defined before filtered versions
  const supervisors = useMemo(() => {
    const sups = allTechnicians.filter(t => t.role === "technicien_superieur");
    return sups;
  }, [allTechnicians]);

  const getTechniciansForSupervisor = useCallback((supervisorId: string) => {
    const techs = allTechnicians.filter(t => 
      t.role === "technicien" && 
      t.id_assigned === supervisorId
    );
    return techs;
  }, [allTechnicians]);

  const getUnassignedTechnicians = useCallback(() => {
    const unassigned = allTechnicians.filter(t => 
      t.role === "technicien" && 
      !t.id_assigned
    );
    return unassigned;
  }, [allTechnicians]);

  // Update state when allTechnicians changes
  useEffect(() => {
    setUpdatedTechnicians(allTechnicians);
  }, [allTechnicians]);

  // Mouse event handlers for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = Math.max(300, Math.min(800, e.clientX));
    setLeftPanelWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSupervisorToggle = useCallback((supervisorId: string) => {
    setExpandedSupervisors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supervisorId)) {
        newSet.delete(supervisorId);
      } else {
        newSet.add(supervisorId);
      }
      return newSet;
    });
  }, []);

  const handleAssignmentChange = useCallback(async (
    technicianId: string, 
    supervisorId: string, 
    checked: boolean
  ) => {
    if (!companyId) {
      // No company ID, updating local state only
      const updatedTech = allTechnicians.find(t => t.id.toString() === technicianId);
      if (!updatedTech) return;

      const newIdAssigned = checked ? supervisorId : null;
      
      // Update both state arrays
      const newAllTechnicians = allTechnicians.map(tech => {
        if (tech.id.toString() === technicianId) {
          return { ...tech, id_assigned: newIdAssigned };
        }
        return tech;
      });

      const newUpdatedTechnicians = updatedTechnicians.map(tech => {
        if (tech.id.toString() === technicianId) {
          return { ...tech, id_assigned: newIdAssigned };
        }
        return tech;
      });

      setAllTechnicians(newAllTechnicians);
      setUpdatedTechnicians(newUpdatedTechnicians);
      return;
    }

    // With company ID, make API call
    try {
      setIsUpdatingAssignment(technicianId);
      
      if (checked) {
        // Assign technician to supervisor
        const response = await assignmentService.assignTechnicianToSupervisor(
          parseInt(technicianId),
          parseInt(supervisorId)
        );
        
        // Update local state after successful API call
        const newAllTechnicians = allTechnicians.map(tech => {
          if (tech.id.toString() === technicianId) {
            return { ...tech, id_assigned: supervisorId };
          }
          return tech;
        });

        const newUpdatedTechnicians = updatedTechnicians.map(tech => {
          if (tech.id.toString() === technicianId) {
            return { ...tech, id_assigned: supervisorId };
          }
          return tech;
        });

        setAllTechnicians(newAllTechnicians);
        setUpdatedTechnicians(newUpdatedTechnicians);
      } else {
        // Unassign technician from supervisor by setting supervisor_id to 0
        const response = await assignmentService.assignTechnicianToSupervisor(
          parseInt(technicianId),
          0
        );
        
        // Update local state after successful API call
        const newAllTechnicians = allTechnicians.map(tech => {
          if (tech.id.toString() === technicianId) {
            return { ...tech, id_assigned: null };
          }
          return tech;
        });

        const newUpdatedTechnicians = updatedTechnicians.map(tech => {
          if (tech.id.toString() === technicianId) {
            return { ...tech, id_assigned: null };
          }
          return tech;
        });

        setAllTechnicians(newAllTechnicians);
        setUpdatedTechnicians(newUpdatedTechnicians);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsUpdatingAssignment(null);
    }
  }, [allTechnicians, updatedTechnicians, companyId]);

  const handleForceUpdate = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete(updatedTechnicians);
  }, [onComplete, updatedTechnicians]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const filteredSupervisors = useMemo(() => {
    if (!searchTerm.trim()) return supervisors;
    
    return supervisors.filter(sup => 
      sup.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supervisors, searchTerm]);

  const unassignedTechs = useMemo(() => getUnassignedTechnicians(), [getUnassignedTechnicians]);

  const filteredUnassignedTechs = useMemo(() => {
    if (!searchTerm.trim()) return unassignedTechs;
    
    return unassignedTechs.filter(tech => 
      tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unassignedTechs, searchTerm]);

  const handleQuickAssign = useCallback((tech: Technician, supervisor: Technician) => {
    if (companyId) {
      handleAssignmentChange(tech.id.toString(), supervisor.id.toString(), true);
    }
  }, [companyId, handleAssignmentChange]);

  const getPreviewData = useCallback((supervisor: Technician) => {
    const assignedTechs = getTechniciansForSupervisor(supervisor.id.toString());
    return {
      supervisor,
      assignedTechnicians: assignedTechs,
      totalAssigned: assignedTechs.length
    };
  }, [getTechniciansForSupervisor]);

  const getUnassignedPreviewData = useCallback(() => {
    return {
      unassignedTechnicians: unassignedTechs,
      totalUnassigned: unassignedTechs.length
    };
  }, [unassignedTechs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Hiérarchie des techniciens
            </h2>
            <p className="text-sm text-gray-600">
              Organisez la structure hiérarchique de votre équipe
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center space-x-2"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span>Réduire</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span>Plein écran</span>
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkip}
            className="flex items-center space-x-2"
          >
            <SkipForward className="h-4 w-4" />
            <span>Passer</span>
          </Button>
          
          <Button
            onClick={handleComplete}
            className="bg-greener-600 hover:bg-greener-700 text-white"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Continuer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Supervisors and Technicians */}
        <div 
          className="bg-white border-r border-gray-200 overflow-y-auto relative"
          style={{ width: `${leftPanelWidth}px`, minWidth: '300px', maxWidth: '800px' }}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des techniciens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors"
            onMouseDown={handleMouseDown}
          />

          {/* Supervisors Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-greener-600" />
                Superviseurs ({filteredSupervisors.length})
              </h3>
            </div>

            <div className="space-y-3">
              {filteredSupervisors.map((supervisor) => {
                const assignedTechs = getTechniciansForSupervisor(supervisor.id.toString());
                const isExpanded = expandedSupervisors.has(supervisor.id.toString());
                
                return (
                  <Card key={supervisor.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-greener-100 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-greener-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-medium text-gray-900">
                              {supervisor.fullName}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{supervisor.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-greener-100 text-greener-800">
                            {assignedTechs.length} technicien(s)
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSupervisorToggle(supervisor.id.toString())}
                            className="p-1 h-8 w-8"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {assignedTechs.length > 0 ? (
                            assignedTechs.map((tech) => (
                              <div
                                key={tech.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {tech.fullName}
                                    </p>
                                    <p className="text-xs text-gray-600">{tech.email}</p>
                                  </div>
                                </div>
                                
                                <Checkbox
                                  checked={true}
                                  onCheckedChange={(checked) => 
                                    handleAssignmentChange(tech.id.toString(), supervisor.id.toString(), !!checked)
                                  }
                                  disabled={isUpdatingAssignment === tech.id.toString()}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Aucun technicien assigné</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Unassigned Technicians Section */}
            {filteredUnassignedTechs.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                    Techniciens non assignés ({filteredUnassignedTechs.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {filteredUnassignedTechs.map((tech) => (
                    <div
                      key={tech.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tech.fullName}
                          </p>
                          <p className="text-xs text-gray-600">{tech.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Non assigné
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Aperçu de la hiérarchie
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Supervisors Preview */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-greener-600" />
                  Superviseurs et leurs équipes
                </h4>
                
                {filteredSupervisors.map((supervisor) => {
                  const previewData = getPreviewData(supervisor);
                  
                  return (
                    <Card key={supervisor.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-greener-100 rounded-full flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-greener-600" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {supervisor.fullName}
                            </span>
                          </div>
                          <Badge variant="secondary" className="bg-greener-100 text-greener-800">
                            {previewData.totalAssigned}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {previewData.assignedTechnicians.length > 0 ? (
                          <div className="space-y-2">
                            {previewData.assignedTechnicians.map((tech) => (
                              <div
                                key={tech.id}
                                className="flex items-center space-x-2 text-sm text-gray-600"
                              >
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span>{tech.fullName}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs">{tech.email}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Aucun technicien assigné
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Unassigned Technicians Preview */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                  Techniciens non assignés
                </h4>
                
                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        Techniciens sans superviseur
                      </span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {getUnassignedPreviewData().totalUnassigned}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {getUnassignedPreviewData().unassignedTechnicians.length > 0 ? (
                      <div className="space-y-2">
                        {getUnassignedPreviewData().unassignedTechnicians.map((tech) => (
                          <div
                            key={tech.id}
                            className="flex items-center space-x-2 text-sm text-gray-600"
                          >
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>{tech.fullName}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs">{tech.email}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Tous les techniciens sont assignés
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Instructions
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Cliquez sur les superviseurs pour voir leurs équipes</li>
                <li>• Utilisez les cases à cocher pour assigner/désassigner des techniciens</li>
                <li>• Les techniciens non assignés apparaissent dans la section bleue</li>
                <li>• Utilisez la barre de recherche pour filtrer les résultats</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
