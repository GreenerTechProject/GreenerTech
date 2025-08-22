import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import CompanySetupWizard from "../components/CompanySetupWizard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { companyService } from "../services/companyService";
import { domainService } from "../services/domainService";
import { serreService } from "../services/serreService";
import { technicianService } from "../services/technicianService";
import { guideService } from "../services/guideService";
import { CompletedSetupData, CompanyInfoSetup, DomainSetup, TechnicianSetup } from "@/types/setup";

export default function DirecteurSetup() {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingCompanyInfo, setIsSubmittingCompanyInfo] = useState(false);

  // Check if user has the correct role
  useEffect(() => {
    if (user && user.role !== "directeur") {
      // Redirect non-directeur users back to general dashboard
      window.location.href = "/dashboard";
      return;
    }
    setIsLoading(false);
  }, [user]);

  const handleCompanySetupComplete = async (setupData: CompletedSetupData) => {
    try {
      setIsSubmittingCompanyInfo(true);

      // Step 1: Create the company
      const companyResponse = await companyService.createCompany(
        setupData.companyInfo,
      );
      const companyId = companyResponse.id || companyResponse.companyId;
      
      if (!companyId) {
        throw new Error("Failed to create company - no ID returned");
      }

      // Immediately update the director's id_entreprise in the backend and context
      try {
        await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
          body: JSON.stringify({ id_entreprise: parseInt(companyId.toString(), 10) }),
        });
        updateUser({ ...(user as any), id_entreprise: parseInt(companyId.toString(), 10) });
      } catch (e) {
        // Failed to set director company id on user
      }

      // Step 2: Create domains
      const domainRequests = setupData.domains.map((domain) => ({
        name: domain.name,
        area: domain.area,
        center: {
          lat: domain.center.lat(),
          lng: domain.center.lng(),
        },
        path: domain.path.map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
        })),
        companyId,
      }));

      const domainResponses = await domainService.createDomains(domainRequests);

      // Step 3: Prepare guide data for after serre creation
      const guideDataMap = new Map<string, any>(); // Maps old guide id to guide data

      // Collect unique guides from all serres
      setupData.domains.forEach((domain) => {
        domain.serres.forEach((serre) => {
          if (serre.guide && !guideDataMap.has(serre.guideId)) {
            guideDataMap.set(serre.guideId, serre.guide);
          }
        });
      });

      // Step 4: Create serres and guides in order
      const allSerres: any[] = [];
      const serreIdMap = new Map<string, number>(); // map temp UI serre id -> backend serre id

      for (let i = 0; i < setupData.domains.length; i++) {
        const domain = setupData.domains[i];
        const backendDomainId = domainResponses[i]?.domainId || domainResponses[i]?.id;
        
        if (!backendDomainId) {
          throw new Error(`Failed to get domain ID for domain: ${domain.name}`);
        }

        // Create serres for this domain
        for (const serre of domain.serres) {
          const serreRequest = {
            nom: serre.nom,
            id_domaine: parseInt(backendDomainId.toString()), // Use the actual backend domain ID as integer
            position: serre.position.map((point, index) => ({
              latitude: point.lat(),
              longitude: point.lng(),
              ordre: index + 1,
            })),
            surface: serre.surface,
            center: {
              lat: serre.center.lat(),
              lng: serre.center.lng(),
            },
          };

          const createdSerre = await serreService.createSerre(serreRequest);
          allSerres.push(createdSerre);
          // record mapping from temp id to backend id
          const backendSerreId = (createdSerre.id || createdSerre.serreId) as number;
          if (backendSerreId) {
            serreIdMap.set(serre.id, parseInt(backendSerreId.toString(), 10));
          }

          // Create guide for this serre if it has one
          if (serre.guide && guideDataMap.has(serre.guideId)) {
            const guide = guideDataMap.get(serre.guideId);
            const serreId = createdSerre.id || createdSerre.serreId;

            if (!serreId) {
              continue;
            }

            const guideRequest = {
              nom: guide.nom,
              variete: guide.variete,
              rendement: guide.rendement,
              nombre_de_plants: guide.nombre_de_plants,
              date_debut_saison:
                typeof guide.date_debut_saison === "string"
                  ? guide.date_debut_saison.split('T')[0] // Convert to YYYY-MM-DD format
                  : guide.date_debut_saison.toISOString().split('T')[0],
              date_fin_saison:
                typeof guide.date_debut_saison === "string"
                  ? guide.date_debut_saison.split('T')[0] // Convert to YYYY-MM-DD format
                  : guide.date_debut_saison.toISOString().split('T')[0],
              id_serre: serreId.toString(), // Link to the actual created serre
            };

            await guideService.createGuide(guideRequest);
          }
        }
      }

      // Step 5: Create technicians
      let createdTechnicians: { id: number; email: string; role: TechnicianSetup["role"]; assignedSerres: string[]; id_assigned?: string | null }[] = [];
      let technicianIdMap = new Map<string, number>(); // Map temp ID to backend ID
      
      if (setupData.technicians.length > 0) {
        const technicianRequests = setupData.technicians.map((technician) => ({
          fullName: technician.fullName,
          email: technician.email,
          role: technician.role,
          assignedSerres: technician.assignedSerres,
          companyId: parseInt(companyId.toString(), 10),
        }));

        const responses = await technicianService.createTechnicians(technicianRequests);
        
        createdTechnicians = responses.map((res, idx) => {
          const originalTech = setupData.technicians[idx];
          
          const tech = {
            id: res.id,
            email: technicianRequests[idx].email,
            role: technicianRequests[idx].role,
            assignedSerres: Array.isArray(originalTech.assignedSerres) ? originalTech.assignedSerres : [],
            id_assigned: originalTech.id_assigned, // Keep the temporary ID for now
          };
          
          // Map the temporary ID to the backend ID for hierarchy assignment
          if (originalTech.id && res.id) {
            technicianIdMap.set(originalTech.id, res.id);
          }
          
          return tech;
        });
        
        // Now update the id_assigned values with backend IDs
        for (const tech of createdTechnicians) {
          if (tech.id_assigned && typeof tech.id_assigned === 'string') {
            const supervisorBackendId = technicianIdMap.get(tech.id_assigned);
            if (supervisorBackendId) {
              tech.id_assigned = supervisorBackendId.toString(); // Convert number to string
            } else {
              tech.id_assigned = null; // Reset if mapping failed
            }
          }
        }
        
        // Step 5b: Only reset technicians that don't have supervisors assigned
        for (const tech of createdTechnicians) {
          // Only reset if the technician doesn't have a supervisor assigned
          if (!tech.id_assigned) {
            try {
              const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/user/${tech.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
                },
                body: JSON.stringify({ 
                  id_assigned: null 
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
              }
            } catch (e) {
              // Failed to reset technician supervisor assignment
            }
          }
        }
      }

      // Step 6: Create autorisations_serre for each technician assigned to serres
      if (createdTechnicians.length > 0) {
        for (const tech of createdTechnicians) {
          // Check if assignedSerres exists and is an array
          if (tech.assignedSerres && Array.isArray(tech.assignedSerres)) {
            for (const assignedTempId of tech.assignedSerres) {
              const targetSerreId = serreIdMap.get(assignedTempId) ?? parseInt(assignedTempId, 10);
              if (!targetSerreId || Number.isNaN(targetSerreId)) continue;
              try {
                await serreService.createAutorisationSerre({
                  id_user: tech.id,
                  id_serre: targetSerreId,
                });
              } catch (e) {
                // Failed to create autorisation_serre
              }
            }
          }
        }
      }

      // Step 7: Create serre assignments to supervisors
      if (setupData.serreAssignments.length > 0) {
        for (const assignment of setupData.serreAssignments) {
          const backendSerreId = serreIdMap.get(assignment.serreId);
          if (!backendSerreId) continue;

          for (const supervisorId of assignment.supervisorIds) {
            const supervisor = createdTechnicians.find(t => 
              t.email === setupData.technicians.find(tech => tech.id === supervisorId)?.email
            );
            
            if (supervisor) {
              try {
                await serreService.createAutorisationSerre({
                  id_user: supervisor.id,
                  id_serre: backendSerreId,
                });
              } catch (e) {
                // Failed to create serre authorization for supervisor
              }
            }
          }
        }
      }

      // Step 8: Update technician hierarchy (supervisor assignments)
      // Find all technicians that need supervisors
      const techniciansNeedingSupervisors = createdTechnicians.filter(t => t.role === "technicien" && t.id_assigned);
      
      if (techniciansNeedingSupervisors.length > 0) {
        for (const tech of techniciansNeedingSupervisors) {
          // Find the supervisor in the created technicians by the backend ID
          const supervisor = createdTechnicians.find(t => t.id === parseInt(tech.id_assigned!, 10));
          
          if (supervisor && supervisor.role === "technicien_superieur") {
            try {
              // Update the technician's supervisor assignment in the backend
              const response = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/user/${tech.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
                },
                body: JSON.stringify({ 
                  id_assigned: supervisor.id 
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP ${response.status}: ${errorData.message || 'Unknown error'}`);
              }
              
              // Verify the assignment was applied correctly
              try {
                const verifyResponse = await fetch(`${window.location.protocol}//${window.location.hostname}:5000/api/user?id=${tech.id}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
                  },
                });
                if (verifyResponse.ok) {
                  const userData = await verifyResponse.json();
                  
                  // Double-check that the assignment is correct
                  if (userData.id_assigned !== supervisor.id) {
                    throw new Error(`Hierarchy assignment verification failed for ${tech.email}`);
                  }
                }
              } catch (verifyError) {
                // Could not verify assignment
              }
              
            } catch (e) {
              throw e; // Stop the setup process if hierarchy assignment fails
            }
          }
        }
      }

      // Update user context with setup_completed = true
      const updatedUser = { ...user!, setup_completed: true };
      updateUser(updatedUser);

      const totalSerres = setupData.domains.reduce(
        (total, domain) => total + domain.serres.length,
        0,
      );
      const totalTechnicians = setupData.technicians.length;
      const totalAssignments = setupData.serreAssignments.length;

      toast({
        title: "Configuration terminée !",
        description: `Votre entreprise, ${setupData.domains.length} domaine(s), ${totalSerres} serre(s), ${totalTechnicians} technicien(s) et ${totalAssignments} assignation(s) ont été configurés avec succès.`,
      });

      // Redirect to the main directeur dashboard
      setTimeout(() => {
        window.location.href = "/directeur";
      }, 2000);

    } catch (error) {
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmittingCompanyInfo(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Logout error
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show setup wizard if user is not connected
  if (!user?.setup_completed) {
    return <CompanySetupWizard onComplete={handleCompanySetupComplete} />;
  }

  // Show main directeur dashboard - redirect to new dashboard
  useEffect(() => {
    if (user?.setup_completed) {
      window.location.href = "/directeur";
    }
  }, [user?.setup_completed]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Tableau de Bord - Directeur
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenue, {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bienvenue sur Greener Tech
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Votre plateforme de gestion d'entreprise agricole intelligente.
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              {user?.name && (
                <p>
                  <span className="font-medium">Nom:</span> {user.name}
                </p>
              )}
              <p>
                <span className="font-medium">Rôle:</span> Directeur
              </p>
              <p>
                <span className="font-medium">Statut:</span>
                <span className="text-greener-600 font-medium"> Connecté</span>
              </p>
            </div>
          </div>

          {/* Company Management Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gestion d'entreprise
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Entreprises affiliées</span>
                <span className="font-medium text-greener-600">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Demandes en attente</span>
                <span className="font-medium text-yellow-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projets actifs</span>
                <span className="font-medium text-greener-600">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Employés total</span>
                <span className="font-medium text-gray-900">43</span>
              </div>
            </div>
          </div>

          {/* Director Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions directeur
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Gérer les affiliations
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Approuver les projets
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Gérer les employés
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Rapports financiers
              </button>
            </div>
          </div>
        </div>

        {/* Company Overview */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Vue d'ensemble de l'entreprise
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-greener-600">
                  €124,580
                </div>
                <div className="text-sm text-gray-600">Revenus ce mois</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">15</div>
                <div className="text-sm text-gray-600">Projets en cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-sm text-gray-600">
                  En attente d'approbation
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">98%</div>
                <div className="text-sm text-gray-600">
                  Efficacité opérationnelle
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Company Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Activité récente de l'entreprise
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-greener-600 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Nouveau projet approuvé - Ferme automatisée Région Nord
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 1h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Demande d'affiliation reçue - TechAgri Solutions
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 3h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Rapport mensuel généré - Performance équipes
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 5h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Mise à jour système - Nouvelles fonctionnalités disponibles
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 1j</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}