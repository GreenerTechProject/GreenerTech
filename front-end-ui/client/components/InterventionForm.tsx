import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Save, Send, ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterventionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: InterventionData) => void;
  onSaveDraft?: (data: InterventionData) => void;
}

interface InterventionData {
  interventionType: string;
  serreId: string;
  interventionDate: string;
  functionary: string;
  description: string;
  priority: "basse" | "moyenne" | "haute" | "urgente";
}

const interventionTypes = [
  { value: "maintenance", label: "Maintenance préventive" },
  { value: "reparation", label: "Réparation" },
  { value: "inspection", label: "Inspection" },
  { value: "recolte", label: "Récolte" },
  { value: "plantation", label: "Plantation" },
  { value: "irrigation", label: "Système d'irrigation" },
  { value: "temperature", label: "Contrôle température" },
  { value: "nettoyage", label: "Nettoyage" },
];

const functionaries = [
  { value: "jean.dupont", label: "Jean Dupont - Technicien Senior" },
  { value: "marie.martin", label: "Marie Martin - Spécialiste Irrigation" },
  { value: "pierre.bernard", label: "Pierre Bernard - Expert Cultures" },
  { value: "sophie.morel", label: "Sophie Morel - Technicien Junior" },
  { value: "paul.durand", label: "Paul Durand - Responsable Maintenance" },
];

const priorityOptions = [
  { value: "basse", label: "Basse", color: "text-gray-600" },
  { value: "moyenne", label: "Moyenne", color: "text-blue-600" },
  { value: "haute", label: "Haute", color: "text-orange-600" },
  { value: "urgente", label: "Urgente", color: "text-red-600" },
];

export default function InterventionForm({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
}: InterventionFormProps) {
  const [formData, setFormData] = useState<InterventionData>({
    interventionType: "",
    serreId: "",
    interventionDate: "",
    functionary: "",
    description: "",
    priority: "moyenne",
  });

  const [errors, setErrors] = useState<Partial<InterventionData>>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Partial<InterventionData> = {};
    
    if (!formData.interventionType) {
      newErrors.interventionType = "Type d'intervention requis";
    }
    if (!formData.serreId) {
      newErrors.serreId = "ID Serre requis";
    }
    if (!formData.interventionDate) {
      newErrors.interventionDate = "Date d'intervention requise";
    }
    if (!formData.functionary) {
      newErrors.functionary = "Fonctionnaire requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit?.(formData);
      toast({
        title: "Intervention créée",
        description: "Votre demande d'intervention a été envoyée avec succès.",
      });
      handleClose();
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.(formData);
    toast({
      title: "Brouillon sauvegardé",
      description: "Votre intervention a été sauvegardée en brouillon.",
    });
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      interventionType: "",
      serreId: "",
      interventionDate: "",
      functionary: "",
      description: "",
      priority: "moyenne",
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (field: keyof InterventionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1396px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex h-[644px] p-8 items-center bg-white rounded-xl">
          <form className="flex w-full h-[580px] flex-col justify-center items-start gap-8">
            {/* Row 1: Type d'intervention & ID Serre */}
            <div className="w-full h-[198px] flex justify-between">
              <div className="flex w-[567px] flex-col justify-center items-start gap-3">
                <Label htmlFor="intervention-type" className="flex items-start gap-0 text-sm font-semibold text-gray-900">
                  Type d'intervention demandée
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.interventionType}
                  onValueChange={(value) => updateFormData("interventionType", value)}
                >
                  <SelectTrigger
                    className={cn(
                      "flex h-[47px] w-[567px] px-3 py-0 justify-between items-center rounded-lg border border-gray-300 bg-white",
                      errors.interventionType && "border-red-500 focus:border-red-500"
                    )}
                  >
                    <SelectValue
                      placeholder="Sélectionner un type d'intervention"
                      className="text-gray-900 font-normal text-base"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {interventionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.interventionType && (
                  <p className="text-sm text-red-500">{errors.interventionType}</p>
                )}
              </div>

              <div className="flex w-[567px] flex-col justify-center items-start gap-3">
                <Label htmlFor="serre-id" className="flex items-start gap-0 text-sm font-semibold text-gray-900">
                  ID Serre
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="serre-id"
                  type="text"
                  value={formData.serreId}
                  onChange={(e) => updateFormData("serreId", e.target.value)}
                  placeholder="Serre / Domaine / Bilan"
                  className={cn(
                    "flex w-[567px] h-[50px] px-4 py-0 items-center rounded-lg border border-gray-300 bg-white text-base text-gray-600",
                    errors.serreId && "border-red-500 focus:border-red-500"
                  )}
                />
                {errors.serreId && (
                  <p className="text-sm text-red-500">{errors.serreId}</p>
                )}
              </div>
            </div>

            {/* Row 2: Date d'intervention & Fonctionnaire */}
            <div className="w-full flex justify-between">
              <div className="flex w-[567px] flex-col justify-center items-start gap-3">
                <Label htmlFor="intervention-date" className="flex items-start gap-0 text-sm font-semibold text-gray-900">
                  Date de l'intervention
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative w-[567px] h-[52px]">
                  <Input
                    id="intervention-date"
                    type="date"
                    value={formData.interventionDate}
                    onChange={(e) => updateFormData("interventionDate", e.target.value)}
                    className={cn(
                      "w-full h-full rounded-lg border border-gray-300 bg-white px-6 text-black text-lg font-normal",
                      errors.interventionDate && "border-red-500 focus:border-red-500"
                    )}
                    placeholder="mm/dd/yyyy"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.75 3V5.25M17.25 3V5.25M3 18.75V7.5C3 6.90326 3.23705 6.33097 3.65901 5.90901C4.08097 5.48705 4.65326 5.25 5.25 5.25H18.75C19.3467 5.25 19.919 5.48705 20.341 5.90901C20.7629 6.33097 21 6.90326 21 7.5V18.75M3 18.75C3 19.3467 3.23705 19.919 3.65901 20.341C4.08097 20.7629 4.65326 21 5.25 21H18.75C19.3467 21 19.919 20.7629 20.341 20.341C20.7629 19.919 21 19.3467 21 18.75M3 18.75V11.25C3 10.6533 3.23705 10.081 3.65901 9.65901C4.08097 9.23705 4.65326 9 5.25 9H18.75C19.3467 9 19.919 9.23705 20.341 9.65901C20.7629 10.081 21 10.6533 21 11.25V18.75" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {errors.interventionDate && (
                  <p className="text-sm text-red-500">{errors.interventionDate}</p>
                )}
              </div>

              <div className="flex w-[567px] flex-col justify-center items-start gap-3">
                <Label htmlFor="functionary" className="flex items-start gap-0 text-sm font-semibold text-gray-900">
                  Fonctionnaire demandé
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.functionary}
                  onValueChange={(value) => updateFormData("functionary", value)}
                >
                  <SelectTrigger
                    className={cn(
                      "flex h-[47px] w-[567px] px-3 py-0 justify-between items-center rounded-lg border border-gray-300 bg-white",
                      errors.functionary && "border-red-500 focus:border-red-500"
                    )}
                  >
                    <SelectValue
                      placeholder="Sélectionner un fonctionnaire"
                      className="text-gray-900 font-normal text-base"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {functionaries.map((functionary) => (
                      <SelectItem key={functionary.value} value={functionary.value}>
                        {functionary.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.functionary && (
                  <p className="text-sm text-red-500">{errors.functionary}</p>
                )}
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="flex w-full flex-col items-start gap-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                Description de l'intervention (optionnel)
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Détails supplémentaires sur l'intervention..."
                rows={5}
                className="flex h-[122px] w-full p-4 items-start rounded-lg border border-gray-300 bg-white resize-none text-gray-600 text-base"
              />
            </div>

            {/* Row 4: Priority */}
            <div className="flex w-full h-[52px] flex-col justify-center items-start gap-3">
              <Label className="text-sm font-semibold text-gray-900">
                Priorité
              </Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(value: any) => updateFormData("priority", value)}
                className="flex w-full items-start gap-6"
              >
                {priorityOptions.map((option) => (
                  <div key={option.value} className="flex items-center justify-center gap-2">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className={cn(
                        "w-4 h-4 rounded-full border-[0.5px] border-black",
                        formData.priority === option.value && "border-blue-500 bg-blue-500"
                      )}
                    />
                    <Label
                      htmlFor={option.value}
                      className="text-sm font-normal cursor-pointer text-gray-600"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Footer Actions */}
            <div className="flex h-[73px] pt-6 justify-between items-start w-full border-t border-gray-200">
              <Button
                type="button"
                onClick={handleClose}
                className="flex h-12 px-6 justify-center items-start gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 border-0"
              >
                <ArrowLeft className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600 text-center font-medium text-base">Annuler</span>
              </Button>

              <div className="flex justify-center items-start gap-4">
                <Button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex h-12 px-6 justify-center items-start gap-2 rounded-lg bg-blue-50 hover:bg-blue-100 border-0"
                >
                  <Save className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 text-center font-medium text-base">Sauvegarder en brouillon</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex h-12 px-6 justify-center items-start gap-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white shadow-md border-0"
                >
                  <Send className="h-4 w-4 text-white" />
                  <span className="text-white text-center font-medium text-base">Envoyer la demande</span>
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
