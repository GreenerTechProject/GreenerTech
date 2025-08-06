import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authService, type User } from "@/services/authService";
import { toast } from "@/hooks/use-toast";
import { 
  ChevronLeft,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

interface ProfileFormData {
  name: string;
  email: string;
  telephone: string;
  birthday: string;
  password?: string;
  confirmPassword?: string;
}

interface ProfileData extends User {
  telephone?: string;
  birthday?: string;
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProfileFormData>();

  const password = watch("password");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      
      const profileData: ProfileData = {
        ...userData,
        telephone: userData.telephone || "",
        birthday: userData.birthday ? userData.birthday.split('T')[0] : "", // Format for date input
      };
      
      setUser(profileData);
      
      // Set form values
      reset({
        name: profileData.name || "",
        email: profileData.email || "",
        telephone: profileData.telephone || "",
        birthday: profileData.birthday || "",
      });
      
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);

      // Validate password confirmation if password is provided
      if (data.password && data.password !== data.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        return;
      }

      // Prepare update data
      const updateData: any = {
        name: data.name,
        email: data.email,
        telephone: data.telephone,
        birthday: data.birthday,
      };

      // Only include password if it's provided
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }

      // Call backend API to update user
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.tokenManager.getToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      // Update local storage
      const updatedUser = { ...user, ...updateData };
      authService.tokenManager.setUser(updatedUser);

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });

      navigate("/profile");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/profile");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Impossible de charger les données utilisateur</p>
            <Button onClick={() => navigate("/profile")} className="mt-4">
              Retour au profil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="" 
        showProfile={false}
      />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/profile")}
          className="mb-6 text-primary hover:text-primary/80"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour au profil
        </Button>

        {/* Profile Edit Card */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Modifier le profil
            </CardTitle>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Informations personnelles
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Prénom
                    </Label>
                    <Input
                      id="name"
                      {...register("name", { 
                        required: "Le prénom est requis" 
                      })}
                      placeholder="Mohamed"
                      className="w-full"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Last Name - Note: For simplicity, using name field for full name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Nom
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Samir"
                      disabled
                      className="w-full bg-gray-50"
                      value="Samir"
                    />
                    <p className="text-xs text-gray-500">
                      Le nom de famille ne peut pas être modifié
                    </p>
                  </div>
                </div>

                {/* Birthday */}
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="birthday" className="text-sm font-medium text-gray-700">
                    Date de naissance
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    {...register("birthday")}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Informations de contact
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                      Numéro de téléphone
                    </Label>
                    <Input
                      id="telephone"
                      {...register("telephone")}
                      placeholder="(+212) 602562364"
                      className="w-full"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Adresse e-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { 
                        required: "L'email est requis",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Format d'email invalide"
                        }
                      })}
                      placeholder="mohamed.sa@greenertech.com"
                      className="w-full"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <div className="pb-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Sécurité
                  </h3>
                </div>
                
                <div className="space-y-6">
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...register("password", {
                          minLength: {
                            value: 6,
                            message: "Le mot de passe doit contenir au moins 6 caractères"
                          }
                        })}
                        placeholder="••••••••"
                        className="w-full pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Laissez vide si vous ne souhaitez pas changer votre mot de passe
                    </p>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword", {
                          validate: (value) => {
                            if (password && !value) {
                              return "Veuillez confirmer votre mot de passe";
                            }
                            if (password && value !== password) {
                              return "Les mots de passe ne correspondent pas";
                            }
                            return true;
                          }
                        })}
                        placeholder="••••••••"
                        className="w-full pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <Button 
                  type="submit"
                  disabled={saving}
                  className="bg-[#004AB3] hover:bg-[#003d96] text-white font-medium"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={saving}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
