import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Edit, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TechnicienSupProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      // Format user data for display
      const formattedUser = {
        ...user,
        // Split name into first and last name if available
        firstName: user.name ? user.name.split(' ')[0] : '',
        lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
        // Format role display
        roleDisplay: getRoleDisplayName(user.role),
        // Use actual user data or provide defaults
        telephone: user.telephone || "Non renseigné",
        birthday: user.birthday ? formatBirthday(user.birthday) : "Non renseigné",
        domaine: "Domaine Ait Melloul", // This would come from user's assigned domaine
        serre: "Serre 1" // This would come from user's assigned serre
      };
      setUserInfo(formattedUser);
    }
  }, [user]);

  const formatBirthday = (birthday: string) => {
    try {
      const date = new Date(birthday);
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      };
      return date.toLocaleDateString('fr-FR', options);
    } catch {
      return birthday;
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "technicien":
        return "Tech";
      case "technicien_superieur":
        return "Tech - Sup";
      case "directeur":
        return "Directeur";
      default:
        return "Utilisateur";
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "technicien":
        return "bg-blue-100 text-blue-800";
      case "technicien_superieur":
        return "bg-purple-100 text-purple-800";
      case "directeur":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditProfile = () => {
    navigate("/technicien-sup/profile/edit");
  };

  const handleBackToDashboard = () => {
    navigate("/technicien-sup");
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={handleBackToDashboard}
            className="mb-6 text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profil Technicien Supérieur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-700">
                    {(userInfo.firstName ? userInfo.firstName[0] : 'U')}
                    {(userInfo.lastName ? userInfo.lastName[0] : '')}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {userInfo.firstName} {userInfo.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      {userInfo.roleDisplay}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleEditProfile}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-900">{userInfo.email}</p>
                  </div>
                </div>

                {userInfo.telephone && userInfo.telephone !== "Non renseigné" && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Téléphone</p>
                      <p className="text-gray-900">{userInfo.telephone}</p>
                    </div>
                  </div>
                )}

                {userInfo.birthday && userInfo.birthday !== "Non renseigné" && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date de naissance</p>
                      <p className="text-gray-900">{userInfo.birthday}</p>
                    </div>
                  </div>
                )}

                {userInfo.name && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Nom complet</p>
                      <p className="text-gray-900">{userInfo.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Vous êtes connecté en tant que Technicien Supérieur avec accès aux fonctionnalités de supervision des serres.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
