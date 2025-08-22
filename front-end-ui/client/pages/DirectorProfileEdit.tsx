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
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import DirectorHeader from "@/components/DirectorHeader";

interface ProfileFormData {
  firstName: string;
  lastName: string;
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

export default function DirectorProfileEdit() {
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
      
      // Split the full name into first and last name
      const nameParts = (profileData.name || "").trim().split(' ');
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(' ') || "";
      
      // Set form values
      reset({
        firstName: firstName,
        lastName: lastName,
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
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        telephone: data.telephone,
        birthday: data.birthday,
      };

      // Only include password if it's provided
      if (data.password) {
        updateData.password = data.password;
      }

      // Update user profile
      await authService.updateProfile(updateData);

      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
      });

      // Navigate back to profile page
      navigate("/directeur/profile");

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DirectorHeader />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DirectorHeader />
      
      <div className="flex-1 transition-all duration-300">
        <div className="max-w-2xl mx-auto p-6 pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Modifier le profil
              </CardTitle>
              <p className="text-gray-600">
                Mettez à jour vos informations personnelles
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Informations personnelles
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        {...register("firstName", { 
                          required: "Le prénom est requis" 
                        })}
                        placeholder="Votre prénom"
                        className={errors.firstName ? "border-red-500" : ""}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-500">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        {...register("lastName", { 
                          required: "Le nom est requis" 
                        })}
                        placeholder="Votre nom"
                        className={errors.lastName ? "border-red-500" : ""}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-500">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="email">Adresse e-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { 
                        required: "L'email est requis",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Adresse e-mail invalide"
                        }
                      })}
                      placeholder="votre.email@exemple.com"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone and Birthday */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="telephone">Numéro de téléphone</Label>
                      <Input
                        id="telephone"
                        {...register("telephone")}
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>

                    {/* Birthday */}
                    <div className="space-y-2">
                      <Label htmlFor="birthday">Date de naissance</Label>
                      <Input
                        id="birthday"
                        type="date"
                        {...register("birthday")}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Modifier le mot de passe
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Laissez vide si vous ne souhaitez pas modifier votre mot de passe
                  </p>

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password">Nouveau mot de passe</Label>
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
                          placeholder="Nouveau mot de passe"
                          className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmPassword", {
                            validate: value => 
                              !password || value === password || "Les mots de passe ne correspondent pas"
                          })}
                          placeholder="Confirmer le mot de passe"
                          className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/directeur/profile")}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
