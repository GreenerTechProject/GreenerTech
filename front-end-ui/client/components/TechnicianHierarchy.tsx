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
  // ALL HOOKS - CALLED UNCONDITIONALLY IN SAME ORDER EVERY TIME
  const [updatedTechnicians, setUpdatedTechnicians] = useState<Technician[]>(initialTechnicians);
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
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
        console.error("Error fetching technicians:", error);
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
    const result = allTechnicians.filter(t => t.role === "technicien_superieur");
    console.log("supervisors computed:", {
      allTechniciansCount: allTechnicians.length,
      resultCount: result.length,
      allTechnicians: allTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned }))
    });
    return result;
  }, [allTechnicians]);

  // Memoized filtered results - must be defined after computed values
  const filteredTechnicians = useMemo(() => {
    if (!searchTerm) return allTechnicians.filter(t => t.role === "technicien");
    return allTechnicians.filter(t => t.role === "technicien").filter(tech => 
      tech.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTechnicians, searchTerm]);

  const filteredSupervisors = useMemo(() => {
    if (!searchTerm) return supervisors;
    return supervisors.filter(sup => 
      sup.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supervisors, searchTerm]);

  // Helper functions - must be defined before useEffect that uses them
  const getTechniciansForSupervisor = (supervisorId: string): Technician[] => {
    const result = allTechnicians.filter(tech => 
      tech.role === "technicien" && 
      tech.id_assigned && 
      tech.id_assigned.toString() === supervisorId.toString()
    );
    console.log(`getTechniciansForSupervisor(${supervisorId}):`, {
      supervisorId,
      allTechniciansCount: allTechnicians.length,
      resultCount: result.length,
      result: result.map(t => ({ id: t.id, fullName: t.fullName, id_assigned: t.id_assigned }))
    });
    return result;
  };

  const getUnassignedTechnicians = (): Technician[] => {
    const result = allTechnicians.filter(tech => tech.role === "technicien" && !tech.id_assigned);
    console.log("getUnassignedTechnicians called:", {
      allTechniciansCount: allTechnicians.length,
      resultCount: result.length,
      allTechnicians: allTechnicians.map(t => ({ id: t.id, fullName: t.fullName, id_assigned: t.id_assigned })),
      result: result.map(t => ({ id: t.id, fullName: t.fullName, id_assigned: t.id_assigned }))
    });
    return result;
  };

  // Debug logging
  useEffect(() => {
    console.log("TechnicianHierarchy state update:", {
      searchTerm,
      allTechnicians: allTechnicians.length,
      supervisors: supervisors.length,
      regularTechnicians: allTechnicians.filter(t => t.role === "technicien").length,
      sampleTechnician: allTechnicians.filter(t => t.role === "technicien")[0],
      sampleSupervisor: supervisors[0],
      expandedSupervisors: Array.from(expandedSupervisors),
      filteredSupervisors: filteredSupervisors.length,
      filteredTechnicians: filteredTechnicians.length,
      unassignedTechnicians: getUnassignedTechnicians().length
    });
    
    if (allTechnicians.length > 0) {
      console.log("Sample technician data:", allTechnicians[0]);
      console.log("Sample supervisor data:", supervisors[0]);
    }
  }, [allTechnicians, supervisors, filteredTechnicians, expandedSupervisors, filteredSupervisors, searchTerm]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log("Mouse down on resize handle");
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newWidth = e.clientX;
      console.log("Mouse move while dragging:", { clientX: e.clientX, newWidth });
      if (newWidth > 250 && newWidth < 1200) {
        setLeftPanelWidth(newWidth);
        console.log("Setting left panel width to:", newWidth);
      }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    console.log("Mouse up, stopping drag");
    setIsDragging(false);
  }, []);

  // Mouse effect
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

  // Early return AFTER all hooks
  if (allTechnicians.length === 0 && !isLoading) {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun technicien disponible</h3>
            <p className="text-gray-500 mb-4">Aucun technicien n'a été créé ou chargé.</p>
            <Button onClick={onBack} variant="outline">
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSupervisorToggle = (supervisorId: string) => {
    console.log("handleSupervisorToggle called with:", supervisorId);
    console.log("Current expandedSupervisors:", Array.from(expandedSupervisors));
    
    setExpandedSupervisors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supervisorId)) {
        newSet.delete(supervisorId);
        console.log("Removing supervisor from expanded set");
      } else {
        newSet.add(supervisorId);
        console.log("Adding supervisor to expanded set");
      }
      console.log("New expandedSupervisors:", Array.from(newSet));
      return newSet;
    });
  };

  const handleAssignmentChange = async (technicianId: string, supervisorId: string, checked: boolean) => {
    console.log("=== ASSIGNMENT CHANGE DEBUG ===");
    console.log("Assignment change:", { technicianId, supervisorId, checked });
    console.log("Company ID:", companyId);
    console.log("Technician data:", allTechnicians.find(t => t.id.toString() === technicianId));
    console.log("Supervisor data:", allTechnicians.find(t => t.id.toString() === supervisorId));
    console.log("BEFORE UPDATE - allTechnicians:", allTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned })));
    console.log("BEFORE UPDATE - updatedTechnicians:", updatedTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned })));
    
    if (!companyId) {
      console.log("No company ID, updating local state only");
      
      // Update both state arrays to keep them in sync
      // Store supervisor ID directly (can be string or number based on the interface)
      const updatedTech = { id_assigned: checked ? supervisorId : null };
      console.log("Updated tech data:", updatedTech);
      console.log("Type of id_assigned:", typeof updatedTech.id_assigned);
      console.log("supervisorId type:", typeof supervisorId);
      console.log("supervisorId value:", supervisorId);
      console.log("parsed supervisorId:", parseInt(supervisorId));
      console.log("Is supervisorId a number string?", !isNaN(parseInt(supervisorId)));
      console.log("technicianId:", technicianId);
      console.log("technicianId type:", typeof technicianId);
      
      // Create new arrays to ensure React detects the change
      const newAllTechnicians = allTechnicians.map(tech => {
        const isMatch = tech.id.toString() === technicianId;
        console.log(`Checking tech ${tech.fullName} (${tech.id}) vs ${technicianId}: ${isMatch}`);
        return isMatch 
          ? { ...tech, ...updatedTech }
          : tech;
      });
      
      const newUpdatedTechnicians = updatedTechnicians.map(tech => 
        tech.id.toString() === technicianId 
          ? { ...tech, ...updatedTech }
          : tech
      );
      
      console.log("New allTechnicians:", newAllTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned, id_assigned_type: typeof t.id_assigned })));
      console.log("New updatedTechnicians:", newUpdatedTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned, id_assigned_type: typeof t.id_assigned })));
      
      // Update state with new arrays
      setAllTechnicians(newAllTechnicians);
      setUpdatedTechnicians(newUpdatedTechnicians);
      
      console.log("Local state updated successfully");
      
      // Force re-render to ensure UI updates
      setForceUpdate(prev => prev + 1);
      
      // Log the state after update
      console.log("=== AFTER STATE UPDATE ===");
      console.log("New allTechnicians state:", newAllTechnicians);
      console.log("New updatedTechnicians state:", newUpdatedTechnicians);
      
      return;
    }

    setIsUpdatingAssignment(technicianId);
    try {
      console.log("=== API CALL DEBUG ===");
      console.log("Calling API with params:", {
        technician_id: parseInt(technicianId),
        supervisor_id: checked ? parseInt(supervisorId) : 0
      });
      
      if (checked) {
        const response = await assignmentService.assignTechnicianToSupervisor(
          parseInt(technicianId),
          parseInt(supervisorId)
        );
        console.log("=== API RESPONSE DEBUG ===");
        console.log("Assignment API response:", response);
      } else {
        const response = await assignmentService.assignTechnicianToSupervisor(
          parseInt(technicianId),
          0
        );
        console.log("=== API RESPONSE DEBUG ===");
        console.log("Unassignment API response:", response);
      }

      // Update both state arrays to keep them in sync
      const updatedTech = { id_assigned: checked ? parseInt(supervisorId) : null };
      
      // Create new arrays to ensure React detects the change
      const newAllTechnicians = allTechnicians.map(tech => 
        tech.id.toString() === technicianId 
          ? { ...tech, ...updatedTech }
          : tech
      );
      
      const newUpdatedTechnicians = updatedTechnicians.map(tech => 
        tech.id.toString() === technicianId 
          ? { ...tech, ...updatedTech }
          : tech
      );
      
      console.log("New allTechnicians after API:", newAllTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned, id_assigned_type: typeof t.id_assigned })));
      console.log("New updatedTechnicians after API:", newUpdatedTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned, id_assigned_type: typeof t.id_assigned })));
      
      // Update state with new arrays
      setAllTechnicians(newAllTechnicians);
      setUpdatedTechnicians(newUpdatedTechnicians);

      console.log("=== STATE UPDATE DEBUG ===");
      console.log("State updated successfully");
      
      // Force re-render to ensure UI updates
      setForceUpdate(prev => prev + 1);
      
      // Also trigger a setTimeout to ensure state has propagated
      setTimeout(() => {
        console.log("=== POST-API-UPDATE DEBUG ===");
        console.log("Current allTechnicians after API update:", allTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned })));
        console.log("Current updatedTechnicians after API update:", updatedTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned })));
        setForceUpdate(prev => prev + 1);
      }, 100);

    } catch (error) {
      console.error("=== API ERROR DEBUG ===");
      console.error("Error updating assignment:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setIsUpdatingAssignment(null);
    }
  };

  const handleContinue = () => {
    onComplete(updatedTechnicians);
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Panel - Responsive */}
      <div 
        className="w-full lg:bg-white lg:border-r flex flex-col transition-all duration-200"
        style={{ 
          width: isFullscreen ? '100%' : (windowWidth < 1024 ? '100%' : `${leftPanelWidth}px`),
          minWidth: isFullscreen ? 'auto' : (windowWidth < 1024 ? 'auto' : '250px'),
          maxWidth: isFullscreen ? 'auto' : (windowWidth < 1024 ? 'auto' : '1200px')
        }}
      >
        {/* Debug info - remove in production */}
        <div className="hidden lg:block text-xs text-gray-500 p-1 bg-gray-100 text-center">
          Panel width: {leftPanelWidth}px | Force update: {forceUpdate} | 
          Total techs: {allTechnicians.length} | 
          Assigned: {allTechnicians.filter(t => t.role === "technicien" && t.id_assigned).length} | 
          Unassigned: {allTechnicians.filter(t => t.role === "technicien" && !t.id_assigned).length}
        </div>
        
        {/* Extended Debug Info */}
        <div className="hidden lg:block text-xs text-gray-400 p-2 bg-gray-200 border-t">
          <div className="font-bold mb-1">DEBUG INFO:</div>
          <div>allTechnicians: {JSON.stringify(allTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned })))}</div>
          <div>updatedTechnicians: {JSON.stringify(updatedTechnicians.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned })))}</div>
          <div>Unassigned count: {allTechnicians.filter(t => t.role === "technicien" && !t.id_assigned).length}</div>
          <div>Supervisors count: {allTechnicians.filter(t => t.role === "technicien_superieur").length}</div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              console.log("=== TEST BUTTON CLICKED ===");
              setForceUpdate(prev => prev + 1);
              console.log("Force update triggered, new value:", forceUpdate + 1);
            }}
            className="mt-2"
          >
            Test Force Update
          </Button>
        </div>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Hiérarchie des Techniciens</h2>
              <p className="text-sm text-gray-600 hidden sm:block">
                Assignez les techniciens aux techniciens supérieurs
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              placeholder="Rechercher des techniciens ou superviseurs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Chargement des techniciens...</span>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Supervisors Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Users className="h-4 w-4" />
                  Techniciens Supérieurs ({allTechnicians.filter(t => t.role === "technicien_superieur").length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allTechnicians.filter(t => t.role === "technicien_superieur").length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {searchTerm ? `Aucun superviseur trouvé pour "${searchTerm}"` : "Aucun technicien supérieur disponible"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allTechnicians
                      .filter(t => t.role === "technicien_superieur")
                      .map((supervisor) => {
                        const assignedTechnicians = allTechnicians.filter(t => 
                          t.role === "technicien" && t.id_assigned && t.id_assigned.toString() === supervisor.id.toString()
                        );
                        const isExpanded = expandedSupervisors.has(supervisor.id.toString());
                      
                      return (
                        <div key={supervisor.id} className="border rounded-lg">
                          <div 
                            className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                console.log("Toggling supervisor:", supervisor.fullName, supervisor.id);
                                handleSupervisorToggle(supervisor.id.toString());
                              }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <div>
                                  <h4 className="font-medium text-sm">{supervisor.fullName}</h4>
                                  <p className="text-xs text-gray-600">{supervisor.email}</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {assignedTechnicians.length} technicien(s)
                              </Badge>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t p-3 bg-gray-50">
                              <div className="space-y-2">
                                <Label className="text-xs text-gray-600">Techniciens assignés:</Label>
                                {assignedTechnicians.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">Aucun technicien assigné</p>
                                ) : (
                                  assignedTechnicians.map((tech) => (
                                    <div key={tech.id} className="flex items-center gap-2">
                                      <UserCheck className="h-3 w-3 text-green-500" />
                                      <span className="text-xs">{tech.fullName}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                          onClick={() => handleAssignmentChange(tech.id.toString(), supervisor.id.toString(), false)}
                                        className="h-4 w-4 p-0 ml-auto"
                                          disabled={isUpdatingAssignment === tech.id.toString()}
                                      >
                                          {isUpdatingAssignment === tech.id.toString() ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                        <Trash2 className="h-3 w-3" />
                                          )}
                                      </Button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unassigned Technicians Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <UserPlus className="h-4 w-4" />
                  Techniciens non assignés ({allTechnicians.filter(t => t.role === "technicien" && !t.id_assigned).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const unassignedTechs = allTechnicians.filter(t => t.role === "technicien" && !t.id_assigned);
                  console.log("=== UNASSIGNED FILTER DEBUG ===");
                  console.log("Total technicians:", allTechnicians.filter(t => t.role === "technicien").length);
                  console.log("Unassigned technicians:", unassignedTechs.length);
                  console.log("Unassigned details:", unassignedTechs.map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned, id_assigned_type: typeof t.id_assigned })));
                  console.log("All technicians details:", allTechnicians.filter(t => t.role === "technicien").map(t => ({ id: t.id, fullName: t.fullName, role: t.role, id_assigned: t.id_assigned, id_assigned_type: typeof t.id_assigned })));
                  
                  if (unassignedTechs.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Tous les techniciens sont assignés
                      </p>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {unassignedTechs.map((tech) => (
                        <div key={tech.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-sm">{tech.fullName}</h4>
                              <p className="text-xs text-gray-600">{tech.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Non assigné
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-600">Assigner à:</Label>
                            <div className="flex flex-wrap gap-2">
                              {allTechnicians
                                .filter(t => t.role === "technicien_superieur")
                                .map((supervisor) => (
                                <Button
                                  key={supervisor.id}
                                  variant="outline"
                                  size="sm"
                                    onClick={() => {
                                      console.log("=== BUTTON CLICK DEBUG ===");
                                      console.log("Button clicked for assignment");
                                      console.log("Technician:", tech);
                                      console.log("Supervisor:", supervisor);
                                      console.log("Company ID:", companyId);
                                      console.log("Current state:", {
                                        allTechnicians: allTechnicians.length,
                                        updatedTechnicians: updatedTechnicians.length,
                                        isUpdatingAssignment
                                      });
                                      
                                      handleAssignmentChange(tech.id.toString(), supervisor.id.toString(), true);
                                    }}
                                  className="text-xs h-7 px-2"
                                    disabled={isUpdatingAssignment === tech.id.toString()}
                                >
                                    {isUpdatingAssignment === tech.id.toString() ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : null}
                                  {supervisor.fullName}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 lg:p-6 border-t bg-gray-50">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="text-sm text-gray-600 text-center lg:text-left">
              {allTechnicians.filter(t => t.role === "technicien" && t.id_assigned).length} technicien(s) assigné(s)
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex items-center gap-2 flex-1 lg:flex-none bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
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
              💡 Vous pouvez ignorer cette étape et configurer la hiérarchie plus tard depuis le tableau de bord
            </p>
          </div>
        </div>
      </div>

      {/* Resizable Handle */}
      {!isFullscreen && windowWidth >= 1024 && (
        <div
          className="w-2 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors relative z-10"
          onMouseDown={handleMouseDown}
          style={{ 
            cursor: isDragging ? 'col-resize' : 'col-resize',
            backgroundColor: isDragging ? '#9CA3AF' : '#D1D5DB'
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <GripVertical className="h-6 w-6 text-gray-600" />
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
              <h3 className="text-lg font-semibold text-gray-900">Aperçu de la Hiérarchie</h3>
              <p className="text-sm text-gray-600 mt-1">
                Vue d'ensemble de l'organisation des techniciens
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
              {supervisors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun superviseur</h4>
                  <p className="text-gray-600">
                    Créez d'abord des techniciens supérieurs
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supervisors.map((supervisor) => {
                    const assignedTechnicians = getTechniciansForSupervisor(supervisor.id.toString());
                    console.log(`Preview for supervisor ${supervisor.fullName}:`, {
                      supervisorId: supervisor.id,
                      assignedTechnicians: assignedTechnicians.length,
                      assignedDetails: assignedTechnicians.map(t => ({ id: t.id, fullName: t.fullName, id_assigned: t.id_assigned }))
                    });
                    
                    return (
                      <Card key={supervisor.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {supervisor.fullName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              {supervisor.email}
                            </p>
                            <div>
                              <p className="text-sm font-medium mb-2">Techniciens sous sa responsabilité:</p>
                              {assignedTechnicians.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Aucun technicien assigné</p>
                              ) : (
                                <div className="space-y-1">
                                  {assignedTechnicians.map((tech) => (
                                    <div key={tech.id} className="flex items-center gap-2">
                                      <UserCheck className="h-3 w-3 text-green-500" />
                                      <span className="text-sm">{tech.fullName}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {(() => {
                    const unassigned = getUnassignedTechnicians();
                    console.log("Preview unassigned technicians:", {
                      count: unassigned.length,
                      details: unassigned.map(t => ({ id: t.id, fullName: t.fullName, id_assigned: t.id_assigned }))
                    });
                    
                    if (unassigned.length > 0) {
                      return (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Techniciens non assignés
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              {unassigned.map((tech) => (
                                <div key={tech.id} className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">{tech.fullName}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    return null;
                  })()}
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
                  <h3 className="text-lg font-semibold text-gray-900">Aperçu de la Hiérarchie - Plein écran</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Vue d'ensemble de l'organisation des techniciens
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
              {supervisors.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun superviseur</h4>
                  <p className="text-gray-600">
                    Créez d'abord des techniciens supérieurs
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {supervisors.map((supervisor) => {
                    const assignedTechnicians = getTechniciansForSupervisor(supervisor.id.toString());
                    
                    return (
                      <Card key={supervisor.id} className="h-fit">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {supervisor.fullName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                              {supervisor.email}
                            </p>
                            <div>
                              <p className="text-sm font-medium mb-2">Techniciens sous sa responsabilité:</p>
                              {assignedTechnicians.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Aucun technicien assigné</p>
                              ) : (
                                <div className="space-y-1">
                                  {assignedTechnicians.map((tech) => (
                                    <div key={tech.id} className="flex items-center gap-2">
                                      <UserCheck className="h-3 w-3 text-green-500" />
                                      <span className="text-sm">{tech.fullName}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {getUnassignedTechnicians().length > 0 && (
                    <Card className="lg:col-span-2 xl:col-span-3">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Techniciens non assignés
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {getUnassignedTechnicians().map((tech) => (
                            <div key={tech.id} className="flex items-center gap-2 p-2 border rounded">
                              <span className="text-sm text-gray-500">{tech.fullName}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
