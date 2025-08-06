import React, { useState, useEffect } from "react";
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
import { Calendar, Save, Send, ArrowLeft, CheckCircle } from "lucide-react";
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
  { value: "basse", label: "Basse" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute", label: "Haute" },
  { value: "urgente", label: "Urgente" },
];

export default function InterventionForm({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
}: InterventionFormProps) {
  console.log("InterventionForm rendered, isOpen:", isOpen);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormStep(0);
      setShowSuccess(false);
      setTimeout(() => {
        const firstField = document.querySelector('#intervention-type-trigger');
        if (firstField) {
          (firstField as HTMLElement).focus();
        }
      }, 300);
    }
  }, [isOpen]);

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

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        onSubmit?.(formData);
        setShowSuccess(true);
        toast({
          title: "✅ Intervention créée",
          description: "Votre demande d'intervention a été envoyée avec succès.",
          duration: 3000,
        });
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (error) {
        toast({
          title: "❌ Erreur",
          description: "Une erreur est survenue lors de l'envoi.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSaveDraft = async () => {
    setIsDrafting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onSaveDraft?.(formData);
      toast({
        title: "💾 Brouillon sauvegardé",
        description: "Votre intervention a été sauvegardée en brouillon.",
        duration: 2000,
      });
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsDrafting(false);
    }
  };

  const handleClose = () => {
    setFormStep(0);
    setShowSuccess(false);
    setIsSubmitting(false);
    setIsDrafting(false);
    setTimeout(() => {
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
    }, 150);
  };

  const updateFormData = (field: keyof InterventionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // ✅ ✅ ✅ Correct placement: now inside the component function body
  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTitle>Intervention Created</DialogTitle>
        <DialogContent className="max-w-md w-[90vw] p-0 bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Intervention créée !</h3>
            <p className="text-gray-600 mb-6">Votre demande a été envoyée avec succès.</p>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 rounded-xl shadow-2xl border-0">
        <div className="flex flex-col h-full bg-white">
          {/* form header and form fields go here (you already had them) */}
          {/* ... */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
