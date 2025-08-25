import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, User, ArrowLeft, Users } from "lucide-react";
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
  variety: string;
  yield: number;
  surface: number;
  domainId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  additionalData?: {
    plantingDate?: Date;
    harvestDate?: Date;
    irrigationType?: string;
    notes?: string;
  };
}

interface Technician {
  id: string;
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  // assignedSerres removed - will be handled in next step
}

interface TechnicianCreationProps {
  domains: Domain[];
  onContinue: (technicians: Technician[]) => void;
  onBack: () => void;
  initialTechnicians?: Technician[];
}

const technicianSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  role: z.enum(["technicien_superieur", "technicien"]),
  // assignedSerres removed - will be handled in next step
});

type TechnicianForm = z.infer<typeof technicianSchema>;

export default function TechnicianCreation({
  domains,
  onContinue,
  onBack,
  initialTechnicians = [],
}: TechnicianCreationProps) {
  const [technicians, setTechnicians] =
    useState<Technician[]>(initialTechnicians);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<TechnicianForm>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "technicien",
    },
  });

  const onSubmit = (data: TechnicianForm) => {
    setIsCreating(true);
    
    const newTechnician: Technician = {
      id: `temp-${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
    };

    setTechnicians((prev) => [...prev, newTechnician]);
    
    form.reset({
      fullName: "",
      email: "",
      role: "technicien",
    });
    
    setIsCreating(false);
  };

  const handleDeleteTechnician = (id: string) => {
    setTechnicians((prev) => prev.filter((tech) => tech.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-white border-r flex flex-col">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Créer vos techniciens
                </h2>
                <p className="text-gray-600 text-sm">
                  Ajoutez des techniciens et assignez-leur des serres à gérer.
                </p>
              </div>
            </div>
            <LogoutWithWarning variant="outline" size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-[#2E7D32]">
                {domains.length}
              </div>
              <div className="text-xs text-[#2E7D32]">Domaines</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {domains.flatMap((domain) => domain.serres).length}
              </div>
              <div className="text-xs text-green-600">Serres</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {technicians.length}
              </div>
              <div className="text-xs text-purple-600">Techniciens</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Technician Creation Form */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5" />
                Nouveau technicien
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Prénom Nom" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="technicien@exemple.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rôle *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un rôle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technicien">
                              Technicien
                            </SelectItem>
                            <SelectItem value="technicien_superieur">
                              Technicien Supérieur
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Serre Assignment - Removed since this is not the right step */}
                  {/* Serres will be assigned in the next step (TechnicianHierarchy) */}

                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter le technicien
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <div className="mb-3 text-sm text-gray-600">
            {technicians.length} technicien{technicians.length > 1 ? "s" : ""}{" "}
            créé{technicians.length > 1 ? "s" : ""}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full sm:w-auto"
            >
              Retour aux serres
            </Button>
            <Button onClick={() => onContinue(technicians)} className="flex-1">
              Continuer vers l'aperçu
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Technicians List */}
      <div className="w-full lg:flex-1 bg-gray-50 p-4 sm:p-6 min-h-[400px] lg:min-h-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Techniciens créés ({technicians.length})
          </h3>
          <p className="text-sm text-gray-600">
            Liste des techniciens qui auront accès au système
          </p>
        </div>

        <div className="space-y-4">
          {technicians.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Aucun technicien
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer votre premier technicien
              </p>
            </div>
          ) : (
            technicians.map((technician) => (
              <Card key={technician.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                        <h4 className="font-medium text-gray-900">
                          {technician.fullName}
                        </h4>
                        <Badge
                          variant={
                            technician.role === "technicien_superieur"
                              ? "default"
                              : "secondary"
                          }
                          className="w-fit"
                        >
                          {technician.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Email: {technician.email}</div>
                      </div>
                      {/* technician.assignedSerres.length > 0 && ( */}
                      {/* Serre assignment removed */}
                      {/* ) */}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTechnician(technician.id)}
                      className="text-red-500 hover:text-red-700 self-start sm:self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
