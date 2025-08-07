import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { authService, type User } from "@/services/authService";
import { toast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Edit,
  LogOut,
  ChevronLeft
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

interface ProfileData extends User {
  telephone?: string;
  birthday?: string;
  domain_name?: string;
  greenhouse_name?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await authService.getCurrentUser();
      
      // For demo purposes, add some mock data for domain and greenhouse
      const profileData: ProfileData = {
        ...userData,
        domain_name: "Domaine Ait Melloul",
        greenhouse_name: "Serre 1",
        telephone: userData.telephone || "+212 6 12 34 56 78",
      };
      
      setUser(profileData);
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

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "directeur":
        return "Directeur";
      case "technicien":
        return "Technicien";
      case "technicien_superieur":
        return "Technicien Supérieur";
      default:
        return role || "Utilisateur";
    }
  };

  const formatBirthday = (birthday?: string) => {
    if (!birthday) return "15 mars 2000"; // Fallback from design
    try {
      const date = new Date(birthday);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return birthday;
    }
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
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
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Retour au tableau de bord
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
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-6 text-primary hover:text-primary/80"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour au dashboard
        </Button>

        {/* Profile Card */}
        <Card className="shadow-lg border-0 bg-white">
          {/* Blue header background */}
          <div className="h-32 bg-gradient-to-r from-[#004AB3] to-[#2563EB] rounded-t-lg relative"></div>
          
          <CardContent className="px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              {/* Profile Avatar Section */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt={user.name || "Profile"} 
                    />
                    <AvatarFallback className="text-2xl font-semibold bg-gray-200">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="flex-1 lg:pt-4">
                <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-6 flex-1">
                    {/* Name and Role */}
                    <div className="pb-2">
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {user.name || "Nom non défini"}
                      </h1>
                      <p className="text-gray-600 font-medium">
                        {getRoleDisplayName(user.role)}
                      </p>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      {/* Domain and Greenhouse */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-greener-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-greener" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Domaine Ait Melloul</p>
                          <p className="text-base font-semibold text-gray-900">
                            {user.greenhouse_name || "Serre 1"}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Phone className="w-4 h-4 text-[#004AB3]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Numéro de téléphone</p>
                          <p className="text-base font-semibold text-gray-900">
                            {user.telephone || "+212 6 12 34 56 78"}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Adresse e-mail</p>
                          <p className="text-base font-semibold text-gray-900">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Birthday */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Date de naissance</p>
                          <p className="text-base font-semibold text-gray-900">
                            {formatBirthday(user.birthday)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
                  <Button 
                    onClick={handleEditProfile}
                    className="bg-[#004AB3] hover:bg-[#003d96] text-white font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier le profil
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
