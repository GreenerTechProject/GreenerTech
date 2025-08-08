import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import existing UI components (reusing as requested)
import CompanySetupWizard from "./CompanySetupWizard";
import DomainCreation from "./DomainCreation";
import SerreCreation from "./SerreCreation";
import TechnicianCreation from "./TechnicianCreation";

// Import services (not modifying as requested)
import { companyService } from "../services/companyService";
import { domainService } from "../services/domainService";
import { serreService } from "../services/serreService";
import { technicianService } from "../services/technicianService";
import { guideService } from "../services/guideService";

interface CompanyInfo {
  nom: string;
  adresse: string;
  cie: string;
  status_juridique: string;
  email: string;
}

interface Domain {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: ExtendedSerre[];
}

interface ExtendedSerre {
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
    nombre_de_plants: number;
    date_debut_saison: Date | string;
    date_fin_saison: Date | string;
  };
}

interface Technician {
  id: string;
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
}

type SetupStep = "company" | "domain" | "serre" | "technician" | "complete";

interface DirectorSetupFlowProps {
  onComplete: () => void;
}

export default function DirectorSetupFlow({ onComplete }: DirectorSetupFlowProps) {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  // Setup state
  const [currentStep, setCurrentStep] = useState<SetupStep>("company");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data collected in each step
  const [companyData, setCompanyData] = useState<CompanyInfo | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  // Step 1: Company Creation
  const handleCompanyComplete = async (companyInfo: CompanyInfo) => {
    try {
      setIsSubmitting(true);
      
      // Create company using existing service
      const response = await companyService.createCompany(companyInfo);
      
      // Save company data and ID for next steps
      setCompanyData(companyInfo);
      setCompanyId(response.id);
      
      toast({
        title: "Entreprise créée",
        description: `L'entreprise "${companyInfo.nom}" a été créée avec succès.`,
      });
      
      // Move to domain creation step
      setCurrentStep("domain");
      
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'entreprise",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Domain Creation
  const handleDomainComplete = async (createdDomains: Domain[]) => {
    try {
      setIsSubmitting(true);
      
      if (!companyId) {
        throw new Error("Company ID not found");
      }
      
      // Create domains using the saved companyId from Step 1
      const domainRequests = createdDomains.map((domain) => ({
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
        companyId: parseInt(companyId), // Use the saved companyId
      }));

      const domainResponses = await domainService.createDomains(domainRequests);
      
      // Update domains with backend IDs and save them
      const updatedDomains = createdDomains.map((domain, index) => ({
        ...domain,
        id: domainResponses[index].domainId, // Save the backend domainId
      }));
      
      setDomains(updatedDomains);
      setSelectedDomainId(updatedDomains[0]?.id || null);
      
      toast({
        title: "Domaines créés",
        description: `${updatedDomains.length} domaine(s) créé(s) avec succès.`,
      });
      
      // Move to serre creation step
      setCurrentStep("serre");
      
    } catch (error) {
      console.error("Error creating domains:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les domaines",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Serre Creation
  const handleSerreComplete = async (domainsWithSerres: Domain[]) => {
    try {
      setIsSubmitting(true);
      
      // Process serres with the saved domainId from Step 2
      const allSerres: any[] = [];
      
      for (const domain of domainsWithSerres) {
        for (const serre of domain.serres) {
          // Create serre using the saved domainId
          const serreRequest = {
            nom: serre.nom,
            id_domaine: parseInt(domain.id), // Use the saved domainId from Step 2
            position: serre.position.map((point, index) => ({
              latitude: point.lat(),
              longitude: point.lng(),
              ordre: index + 1,
            })),
          };

          const createdSerre = await serreService.createSerre(serreRequest);
          allSerres.push(createdSerre);

          // Create guide for this serre if it has one (guide must be selected)
          if (serre.guide && serre.guideId) {
            const guide = serre.guide;

            const guideRequest = {
              nom: guide.nom,
              variete: guide.variete,
              rendement: guide.rendement,
              nombre_de_plants: guide.nombre_de_plants,
              date_debut_saison:
                typeof guide.date_debut_saison === "string"
                  ? guide.date_debut_saison
                  : guide.date_debut_saison.toISOString(),
              date_fin_saison:
                typeof guide.date_fin_saison === "string"
                  ? guide.date_fin_saison
                  : guide.date_fin_saison.toISOString(),
              id_serre: createdSerre.id.toString(), // Link to the actual created serre
            };

            // Pass the selected guideId and other serre data to the backend
            await guideService.createGuide(guideRequest);
          }
        }
      }
      
      // Update domains with complete serre data
      setDomains(domainsWithSerres);
      
      const totalSerres = domainsWithSerres.reduce(
        (total, domain) => total + domain.serres.length,
        0,
      );
      
      toast({
        title: "Serres créées",
        description: `${totalSerres} serre(s) créée(s) avec succès.`,
      });
      
      // Move to technician setup step
      setCurrentStep("technician");
      
    } catch (error) {
      console.error("Error creating serres:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les serres",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Technician Setup (remains the same as in the old setup)
  const handleTechnicianComplete = async (createdTechnicians: Technician[]) => {
    try {
      setIsSubmitting(true);
      
      if (!companyId) {
        throw new Error("Company ID not found");
      }
      
      // Create technicians (remains the same)
      const technicianRequests = createdTechnicians.map((technician) => ({
        fullName: technician.fullName,
        email: technician.email,
        role: technician.role,
        assignedSerres: technician.assignedSerres,
        companyId: parseInt(companyId),
      }));

      await technicianService.createTechnicians(technicianRequests);
      
      setTechnicians(createdTechnicians);
      
      // Update user context with setup_completed = true
      updateUser({ ...user!, setup_completed: true });
      
      toast({
        title: "Configuration terminée !",
        description: `Votre configuration a été enregistrée avec succès.`,
      });
      
      setCurrentStep("complete");
      
      // Redirect to newDirectorDashboard after setup completion
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (error) {
      console.error("Error creating technicians:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les techniciens",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "company":
        return "Étape 1: Création de l'entreprise";
      case "domain":
        return "Étape 2: Création des domaines";
      case "serre":
        return "Étape 3: Création des serres";
      case "technician":
        return "Étape 4: Configuration des techniciens";
      case "complete":
        return "Configuration terminée";
      default:
        return "";
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "company":
        return 25;
      case "domain":
        return 50;
      case "serre":
        return 75;
      case "technician":
        return 90;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  if (currentStep === "complete") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Configuration terminée !</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Votre configuration a été enregistrée avec succès. Vous allez être redirigé vers votre tableau de bord.
            </p>
            <div className="space-y-2">
              {companyData && (
                <Badge variant="outline">Entreprise: {companyData.nom}</Badge>
              )}
              <Badge variant="outline">Domaines: {domains.length}</Badge>
              <Badge variant="outline">
                Serres: {domains.reduce((total, domain) => total + domain.serres.length, 0)}
              </Badge>
              <Badge variant="outline">Techniciens: {technicians.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{getStepTitle()}</h1>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#B4CC5F] h-2 rounded-full transition-all duration-300"
                style={{ width: `${getStepProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Enregistrement en cours...</span>
            </div>
          </div>
        )}

        {currentStep === "company" && (
          <CompanySetupWizard
            onComplete={(setupData) => handleCompanyComplete(setupData.companyInfo)}
            showStepsOnly="company"
          />
        )}

        {currentStep === "domain" && (
          <DomainCreation
            onContinue={handleDomainComplete}
            onBack={() => setCurrentStep("company")}
            createDomain={async (domainData) => {
              // This is handled in handleDomainComplete
              return { id: "temp" };
            }}
          />
        )}

        {currentStep === "serre" && (
          <SerreCreation
            domains={domains}
            onComplete={handleSerreComplete}
            onBack={() => setCurrentStep("domain")}
            selectedDomainId={selectedDomainId || undefined}
            setupMode={true} // Use setup mode to preserve map/drawing functionality
          />
        )}

        {currentStep === "technician" && (
          <TechnicianCreation
            domains={domains}
            onComplete={handleTechnicianComplete}
            onBack={() => setCurrentStep("serre")}
          />
        )}
      </div>
    </div>
  );
}
