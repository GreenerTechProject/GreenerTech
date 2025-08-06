import React, { useState } from "react";
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
} from "lucide-react";
import DomainCreation from "./DomainCreation";
import SerreCreation from "./SerreCreation";
import TechnicianCreation from "./TechnicianCreation";
import FinalOverview from "./FinalOverview";
import {
  CompletedSetupData,
  DomainSetup,
  SerreSetup,
  TechnicianSetup,
  CompanyInfoSetup,
} from "../types/setup";

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

// Using shared types from ../types/setup
type Domain = DomainSetup;

type Technician = TechnicianSetup;

// Use shared CompletedSetupData but adapt companyInfo type
interface LocalCompletedSetupData {
  companyInfo: CompanyInfoForm;
  domains: Domain[];
  technicians: Technician[];
}

interface CompanySetupWizardProps {
  onComplete: (data: LocalCompletedSetupData) => Promise<void>;
}

type WizardStep = "company" | "domains" | "serres" | "technicians" | "overview";

export default function CompanySetupWizard({
  onComplete,
}: CompanySetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("company");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoForm | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

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

  const handleSerresComplete = (finalDomains: Domain[]) => {
    setDomains(finalDomains);
    setCurrentStep("technicians");
  };

  const handleTechniciansComplete = (finalTechnicians: Technician[]) => {
    setTechnicians(finalTechnicians);
    setCurrentStep("overview");
  };

  const handleFinalComplete = async () => {
    if (!companyInfo) return;

    try {
      setIsSubmitting(true);
      const completedData: CompletedSetupData = {
        companyInfo,
        domains,
        technicians,
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

  const handleBackToCompany = () => {
    setCurrentStep("company");
  };

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
        return domains.length > 0 && domains.some((d) => d.serres.length > 0)
          ? "completed"
          : domains.length > 0
            ? "pending"
            : "disabled";
      case "technicians":
        return technicians.length > 0
          ? "completed"
          : domains.length > 0 && domains.some((d) => d.serres.length > 0)
            ? "pending"
            : "disabled";
      case "overview":
        return technicians.length > 0 ? "pending" : "disabled";
      default:
        return "disabled";
    }
  };

  // Render step-specific content
  if (currentStep === "domains") {
    return (
      <DomainCreation
        onContinue={handleDomainsComplete}
        onBack={handleBackToCompany}
        initialDomains={domains}
      />
    );
  }

  if (currentStep === "serres") {
    return (
      <SerreCreation
        domains={domains}
        onComplete={handleSerresComplete}
        onBack={handleBackToDomains}
      />
    );
  }

  if (currentStep === "technicians") {
    return (
      <TechnicianCreation
        domains={domains}
        onContinue={handleTechniciansComplete}
        onBack={handleBackToSerres}
        initialTechnicians={technicians}
      />
    );
  }

  if (currentStep === "overview") {
    return (
      <FinalOverview
        companyInfo={companyInfo!}
        domains={domains}
        technicians={technicians}
        onComplete={handleFinalComplete}
        onBack={handleBackToTechnicians}
        isSubmitting={isSubmitting}
      />
    );
  }

  // Step 1: Company Information
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Configuration de votre entreprise
          </CardTitle>
          <CardDescription className="text-gray-600">
            Étape 1 sur 5 : Informations de base de votre entreprise
          </CardDescription>

          {/* Progress Steps */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    getStepStatus("company") === "current"
                      ? "bg-[#B4CC5F] text-white"
                      : getStepStatus("company") === "completed"
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {getStepStatus("company") === "completed" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-xs font-medium">Entreprise</span>
              </div>

              <div className="w-4 h-px bg-gray-300"></div>

              <div className="flex items-center space-x-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    getStepStatus("domains") === "current"
                      ? "bg-[#B4CC5F] text-white"
                      : getStepStatus("domains") === "completed"
                        ? "bg-green-500 text-white"
                        : getStepStatus("domains") === "pending"
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {getStepStatus("domains") === "completed" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    "2"
                  )}
                </div>
                <span className="text-xs font-medium">Domaines</span>
              </div>

              <div className="w-4 h-px bg-gray-300"></div>

              <div className="flex items-center space-x-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    getStepStatus("serres") === "current"
                      ? "bg-[#B4CC5F] text-white"
                      : getStepStatus("serres") === "completed"
                        ? "bg-green-500 text-white"
                        : getStepStatus("serres") === "pending"
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {getStepStatus("serres") === "completed" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    "3"
                  )}
                </div>
                <span className="text-xs font-medium">Serres</span>
              </div>

              <div className="w-4 h-px bg-gray-300"></div>

              <div className="flex items-center space-x-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    getStepStatus("technicians") === "current"
                      ? "bg-[#B4CC5F] text-white"
                      : getStepStatus("technicians") === "completed"
                        ? "bg-green-500 text-white"
                        : getStepStatus("technicians") === "pending"
                          ? "bg-gray-200 text-gray-500"
                          : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {getStepStatus("technicians") === "completed" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    "4"
                  )}
                </div>
                <span className="text-xs font-medium">Équipe</span>
              </div>

              <div className="w-4 h-px bg-gray-300"></div>

              <div className="flex items-center space-x-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    getStepStatus("overview") === "current"
                      ? "bg-[#B4CC5F] text-white"
                      : getStepStatus("overview") === "completed"
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  5
                </div>
                <span className="text-xs font-medium">Aperçu</span>
              </div>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                        placeholder="contact@votre-entreprise.com"
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
