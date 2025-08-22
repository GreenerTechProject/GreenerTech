import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Building,
  MapPin,
  Home,
  Users,
  CheckCircle,
  SkipForward,
  UserCheck,
  ArrowRight,
  Search,
  GripVertical,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import DomainCreation from "./DomainCreation";
import SerreCreation from "./SerreCreation";
import TechnicianCreation from "./TechnicianCreation";
import FinalOverview from "./FinalOverview";
import SerreAssignment from "./SerreAssignment";
import TechnicianHierarchy from "./TechnicianHierarchy";
import { useIsMobile } from "@/hooks/use-mobile";

const companyInfoSchema = z.object({
  nom: z.string().min(1, "Le nom de l'entreprise est requis"),
  adresse: z.string().min(1, "L'adresse de l'entreprise est requise"),
  cie: z.string().min(1, "Le CIE est requis"),
  status_juridique: z.string().min(1, "Le statut juridique est requis"),
  email: z
    .string()
    .email("Email invalide")
    .min(1, "L'email de l'entreprise est requis"),
});

type CompanyInfoForm = z.infer<typeof companyInfoSchema>;

// Define interfaces that match the expected structure
interface Domain {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: any[];
}

interface Technician {
  id: string;
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[]; // Serres assigned to this technician (for Technicien Sup)
  id_assigned?: string | null; // ID of supervisor this technician reports to (for regular technicians)
}

interface SerreAssignment {
  serreId: string;
  supervisorIds: string[]; // Array of Technicien Sup IDs assigned to this serre
}

interface CompletedSetupData {
  companyInfo: CompanyInfoForm;
  domains: Domain[];
  technicians: Technician[];
  serreAssignments: SerreAssignment[];
}

interface CompanySetupWizardProps {
  onComplete: (data: CompletedSetupData) => Promise<void>;
}

type WizardStep = 
  | "company" 
  | "domains" 
  | "serres" 
  | "technicians" 
  | "serreAssignment" 
  | "technicianHierarchy" 
  | "overview";

export default function CompanySetupWizard({
  onComplete,
}: CompanySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("company");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoForm | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [serreAssignments, setSerreAssignments] = useState<SerreAssignment[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<Set<WizardStep>>(new Set());
  const [leftPanelWidth, setLeftPanelWidth] = useState(500);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  
  const isMobile = useIsMobile();

  const form = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      nom: "",
      adresse: "",
      cie: "",
      status_juridique: "",
      email: "",
    },
  });

  const handleCompanyInfoSubmit = async (data: CompanyInfoForm) => {
    setCompanyInfo(data);
    setCurrentStep("domains");
  };

  const handleDomainsComplete = (domainsData: Domain[]) => {
    setDomains(domainsData);
    setCurrentStep("serres");
  };

  const handleSerresComplete = (finalDomains: Domain[], wasSkipped: boolean = false) => {
    setDomains(finalDomains);
    
    if (wasSkipped) {
      setSkippedSteps(prev => new Set([...prev, "serres"]));
      setCurrentStep("technicians");
    } else {
      // Always go to technicians after serres (serre assignment comes later)
      setCurrentStep("technicians");
    }
  };

  const handleTechniciansComplete = (finalTechnicians: Technician[]) => {
    setTechnicians(finalTechnicians);
    
    // Check if we have serres and supervisors to assign
    const hasSerres = domains.some(d => d.serres.length > 0);
    const hasSupervisors = finalTechnicians.some(t => t.role === "technicien_superieur");
    
    if (hasSerres && hasSupervisors) {
      setCurrentStep("serreAssignment");
    } else if (hasSupervisors && finalTechnicians.some(t => t.role === "technicien")) {
      // Go to hierarchy if we have both supervisors and technicians
      setCurrentStep("technicianHierarchy");
    } else {
      setCurrentStep("overview");
    }
  };

  const handleSerreAssignmentComplete = (assignments: SerreAssignment[], wasSkipped: boolean = false) => {
    if (wasSkipped) {
      setSkippedSteps(prev => new Set([...prev, "serreAssignment"]));
    } else {
      setSerreAssignments(assignments);
    }
    
    // Check if we should go to hierarchy or overview
    // Use the current technicians state that was set in handleTechniciansComplete
    const hasSupervisors = technicians.some(t => t.role === "technicien_superieur");
    const hasTechnicians = technicians.some(t => t.role === "technicien");
    
    if (hasSupervisors && hasTechnicians) {
      setCurrentStep("technicianHierarchy");
    } else {
      setCurrentStep("overview");
    }
  };

  const handleTechnicianHierarchyComplete = (finalTechnicians: Technician[], wasSkipped: boolean = false) => {
    if (wasSkipped) {
      setSkippedSteps(prev => new Set([...prev, "technicianHierarchy"]));
    } else {
      // Store the technician hierarchy assignments for later use when technicians are created
      console.log("=== STORING TECHNICIAN HIERARCHY ASSIGNMENTS ===");
      console.log("Technicians with planned assignments:", finalTechnicians);
      setTechnicians(finalTechnicians);
    }
    setCurrentStep("overview");
  };

  const handleFinalComplete = async () => {
    if (!companyInfo) return;

    try {
      setIsSubmitting(true);
      
      // Debug: Log what data we're about to send
      console.log("=== FINAL SETUP DATA DEBUG ===");
      console.log("Company info:", companyInfo);
      console.log("Domains:", domains.length);
      console.log("Technicians:", technicians);
      console.log("Serre assignments:", serreAssignments);
      
      // Check if technicians have hierarchy assignments
      const techniciansWithAssignments = technicians.filter(t => t.role === "technicien" && t.id_assigned);
      console.log("Technicians with supervisor assignments:", techniciansWithAssignments);
      
      const completedData: CompletedSetupData = {
        companyInfo,
        domains,
        technicians,
        serreAssignments,
      };
      await onComplete(completedData);
    } catch (error) {
      console.error("Error completing setup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToDomains = () => {
    setCurrentStep("domains");
  };

  const handleBackToSerres = () => {
    setCurrentStep("serres");
  };

  const handleBackToTechnicians = () => {
    setCurrentStep("technicians");
  };

  const handleBackToSerreAssignment = () => {
    setCurrentStep("serreAssignment");
  };

  const handleBackToTechnicianHierarchy = () => {
    setCurrentStep("technicianHierarchy");
  };

  const handleBackToCompany = () => {
    setCurrentStep("company");
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isMobile) {
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
    if (isDragging && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isMobile]);

  const legalStatusOptions = [
    { value: "sarl", label: "SARL (Société à Responsabilité Limitée)" },
    { value: "sa", label: "SA (Société Anonyme)" },
    { value: "sas", label: "SAS (Société par Actions Simplifiée)" },
    {
      value: "eurl",
      label: "EURL (Entreprise Unipersonnelle à Responsabilité Limitée)",
    },
    { value: "sci", label: "SCI (Société Civile Immobilière)" },
    { value: "auto-entrepreneur", label: "Auto-Entrepreneur" },
    { value: "association", label: "Association" },
    { value: "autre", label: "Autre" },
  ];

  const getStepStatus = (step: WizardStep) => {
    if (step === currentStep) return "current";

    switch (step) {
      case "company":
        return companyInfo ? "completed" : "pending";
      case "domains":
        return domains.length > 0
          ? "completed"
          : companyInfo
            ? "pending"
            : "disabled";
      case "serres":
        if (skippedSteps.has("serres")) return "skipped";
        return domains.length > 0
          ? "completed"
          : domains.length > 0
            ? "pending"
            : "disabled";
      case "technicians":
        return technicians.length > 0
          ? "completed"
          : domains.length > 0
            ? "pending"
            : "disabled";
      case "serreAssignment":
        if (skippedSteps.has("serreAssignment")) return "skipped";
        const hasSerresForAssignment = domains.some(d => d.serres.length > 0);
        const hasSupervisorsForAssignment = technicians.some(t => t.role === "technicien_superieur");
        return hasSerresForAssignment && hasSupervisorsForAssignment && serreAssignments.length > 0
          ? "completed"
          : hasSerresForAssignment && hasSupervisorsForAssignment
            ? "pending"
            : "skipped";
      case "technicianHierarchy":
        if (skippedSteps.has("technicianHierarchy")) return "skipped";
        const hasSupervisorsForHierarchy = technicians.some(t => t.role === "technicien_superieur");
        const hasTechnicians = technicians.some(t => t.role === "technicien");
        return hasSupervisorsForHierarchy && hasTechnicians && technicians.some(t => t.id_assigned)
          ? "completed"
          : hasSupervisorsForHierarchy && hasTechnicians
            ? "pending"
            : "skipped";
      case "overview":
        return technicians.length > 0 ? "pending" : "disabled";
      default:
        return "disabled";
    }
  };

  const getStepIcon = (step: WizardStep) => {
    switch (step) {
      case "company": return Building;
      case "domains": return MapPin;
      case "serres": return Home;
      case "technicians": return Users;
      case "serreAssignment": return UserCheck;
      case "technicianHierarchy": return ArrowRight;
      case "overview": return CheckCircle;
      default: return Building;
    }
  };

  const getStepLabel = (step: WizardStep) => {
    switch (step) {
      case "company": return "Entreprise";
      case "domains": return "Domaines";
      case "serres": return "Serres";
      case "technicians": return "Techniciens";
      case "serreAssignment": return "Assignation Serres";
      case "technicianHierarchy": return "Hiérarchie";
      case "overview": return "Aperçu";
      default: return step;
    }
  };

  // Render step-specific content
  if (currentStep === "company") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Configuration de votre entreprise
            </CardTitle>
            <CardDescription className="text-gray-600">
              Étape 1 sur 7 : Informations de base de votre entreprise
            </CardDescription>

            {/* Progress Steps */}
            <div className="flex justify-center mt-6 overflow-x-auto">
              <div className="flex items-center space-x-2 min-w-max">
                {[
                  "company",
                  "domains", 
                  "serres",
                  "technicians",
                  "serreAssignment",
                  "technicianHierarchy",
                  "overview"
                ].map((step, index) => {
                  const stepKey = step as WizardStep;
                  const status = getStepStatus(stepKey);
                  const Icon = getStepIcon(stepKey);
                  const label = getStepLabel(stepKey);
                  
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                            status === "completed"
                              ? "bg-greener-600 border-greener-600 text-white"
                              : status === "current"
                                ? "bg-blue-500 border-blue-500 text-white"
                                : status === "skipped"
                                  ? "bg-gray-200 border-gray-300 text-gray-500"
                                  : "bg-gray-100 border-gray-300 text-gray-400"
                          }`}
                        >
                          {status === "completed" ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : status === "skipped" ? (
                            <SkipForward className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <span className="text-xs mt-1 text-gray-600 max-w-16 text-center">
                          {label}
                        </span>
                      </div>
                      {index < 6 && (
                        <div
                          className={`w-8 h-0.5 mx-2 ${
                            status === "completed" ? "bg-greener-600" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCompanyInfoSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Saisissez le nom de votre entreprise"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse de l'entreprise *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Saisissez l'adresse complète"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIE (Identifiant de l'entreprise) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Saisissez le CIE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status_juridique"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut juridique *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez le statut juridique" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {legalStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de l'entreprise *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Saisissez l'email de l'entreprise"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Continuer"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === "domains") {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Création de Domaines</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Left Panel - Mobile Responsive */}
        <div className={`lg:hidden ${isLeftPanelCollapsed ? 'hidden' : 'block'} bg-white border-b`}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les domaines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {domains.map((domain) => (
                <div key={domain.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{domain.name}</h4>
                  <p className="text-xs text-gray-600">Domaine</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Left Panel - Draggable and Resizable */}
        <div className="hidden lg:block bg-white border-r border-gray-200 overflow-y-auto relative"
             style={{ width: `${leftPanelWidth}px`, minWidth: '300px', maxWidth: '800px' }}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les domaines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {domains.map((domain) => (
                <div key={domain.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{domain.name}</h4>
                  <p className="text-xs text-gray-600">Domaine</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <DomainCreation
            onContinue={handleDomainsComplete}
            onBack={handleBackToCompany}
            initialDomains={domains}
          />
        </div>
      </div>
    );
  }

  if (currentStep === "serres") {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Création de Serres</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Left Panel - Mobile Responsive */}
        <div className={`lg:hidden ${isLeftPanelCollapsed ? 'hidden' : 'block'} bg-white border-b`}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les serres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {domains.flatMap(d => d.serres).map((serre) => (
                <div key={serre.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{serre.nom}</h4>
                  <p className="text-xs text-gray-600">Serre</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Left Panel - Draggable and Resizable */}
        <div className="hidden lg:block bg-white border-r border-gray-200 overflow-y-auto relative"
             style={{ width: `${leftPanelWidth}px`, minWidth: '300px', maxWidth: '800px' }}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les serres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {domains.flatMap(d => d.serres).map((serre) => (
                <div key={serre.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{serre.nom}</h4>
                  <p className="text-xs text-gray-600">Serre</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <SerreCreation
            domains={domains}
            onComplete={handleSerresComplete}
            onBack={handleBackToDomains}
            setupMode={true}
          />
        </div>
      </div>
    );
  }

  if (currentStep === "technicians") {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Création de Techniciens</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Left Panel - Mobile Responsive */}
        <div className={`lg:hidden ${isLeftPanelCollapsed ? 'hidden' : 'block'} bg-white border-b`}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les techniciens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {technicians.map((tech) => (
                <div key={tech.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{tech.fullName}</h4>
                  <p className="text-xs text-gray-600">{tech.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Left Panel - Draggable and Resizable */}
        <div className="hidden lg:block bg-white border-r border-gray-200 overflow-y-auto relative"
             style={{ width: `${leftPanelWidth}px`, minWidth: '300px', maxWidth: '800px' }}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les techniciens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {technicians.map((tech) => (
                <div key={tech.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{tech.fullName}</h4>
                  <p className="text-xs text-gray-600">{tech.role}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors"
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <TechnicianCreation
            domains={domains}
            onContinue={handleTechniciansComplete}
            onBack={handleBackToSerres}
            initialTechnicians={technicians}
          />
        </div>
      </div>
    );
  }

  if (currentStep === "serreAssignment") {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Assignation des Serres</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Left Panel - Mobile Responsive */}
        <div className={`lg:hidden ${isLeftPanelCollapsed ? 'hidden' : 'block'} bg-white border-b`}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {serreAssignments.map((assignment) => (
                <div key={assignment.serreId} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">Serre {assignment.serreId}</h4>
                  <p className="text-xs text-gray-600">{assignment.supervisorIds.length} superviseur(s)</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <SerreAssignment
            technicians={technicians}
            domains={domains}
            onComplete={(a) => handleSerreAssignmentComplete(a)}
            onBack={handleBackToTechnicians}
            onSkip={() => handleSerreAssignmentComplete([], true)}
            initialAssignments={serreAssignments}
          />
        </div>
      </div>
    );
  }

  if (currentStep === "technicianHierarchy") {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Hiérarchie des Techniciens</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Left Panel - Mobile Responsive */}
        <div className={`lg:hidden ${isLeftPanelCollapsed ? 'hidden' : 'block'} bg-white border-b`}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des techniciens ou superviseurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              {technicians.filter(t => t.role === "technicien_superieur").map((sup) => (
                <div key={sup.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-sm">{sup.fullName}</h4>
                  <p className="text-xs text-gray-600">Superviseur</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <TechnicianHierarchy
            technicians={technicians as any}
            onComplete={(t) => handleTechnicianHierarchyComplete(t as any)}
            onBack={handleBackToSerreAssignment}
            onSkip={() => handleTechnicianHierarchyComplete(technicians, true)}
            companyId={companyInfo?.cie ? parseInt(companyInfo.cie) : undefined}
          />
        </div>
      </div>
    );
  }

  if (currentStep === "overview") {
    return (
      <div className="h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Mobile Header with Toggle */}
        <div className="lg:hidden p-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Aperçu Final</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Left Panel - Mobile Responsive */}
        <div className={`lg:hidden ${isLeftPanelCollapsed ? 'hidden' : 'block'} bg-white border-b`}>
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans l'aperçu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Entreprise</h4>
                <p className="text-xs text-gray-600">{companyInfo?.nom}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Domaines</h4>
                <p className="text-xs text-gray-600">{domains.length} domaine(s)</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">Techniciens</h4>
                <p className="text-xs text-gray-600">{technicians.length} technicien(s)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <FinalOverview
            companyInfo={{
              companyName: companyInfo!.nom,
              companyAddress: companyInfo!.adresse,
              cie: companyInfo!.cie,
              legalStatus: companyInfo!.status_juridique,
              companyEmail: companyInfo!.email,
            }}
            domains={domains as any}
            technicians={technicians as any}
            serreAssignments={serreAssignments}
            onComplete={handleFinalComplete}
            onBack={handleBackToTechnicianHierarchy}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }
}