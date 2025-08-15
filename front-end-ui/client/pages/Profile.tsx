import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  LogOut, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Sprout
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TechHeader from "@/components/TechHeader";

export default function Profile() {
  const { user, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = () => {
    if (userInfo.role === "technicien_superieur") {
      navigate("/technicien-sup/profile/edit");
    } else {
      navigate("/technicien/profile/edit");
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Show TechHeader for all technician users */}
      {(userInfo.role === "technicien" || userInfo.role === "technicien_superieur") && (
        <TechHeader role={userInfo.role === "technicien_superieur" ? "technicien_sup" : "technicien"} />
      )}
      
      <div className="flex items-center justify-center p-4">
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              if (userInfo.role === "technicien_superieur") {
                navigate("/technicien-sup");
              } else {
                navigate("/technician");
              }
            }}
            className="text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
        
        <Card className="w-full max-w-md shadow-lg border-0">
        {/* Green Header with User Info */}
        <div className="bg-green-600 rounded-t-lg p-6 relative">
          {/* Profile Picture Placeholder - No actual image as requested */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 relative">
            <div className="text-2xl font-bold text-green-600">
              {userInfo.firstName ? userInfo.firstName[0] : 'U'}
              {userInfo.lastName ? userInfo.lastName[0] : ''}
            </div>
            {/* Online status dot */}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          {/* User Name and Role */}
          <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">
              {userInfo.firstName} {userInfo.lastName}
            </h1>
            <Badge className={`${getRoleColor(userInfo.role)} text-sm`}>
              {userInfo.roleDisplay}
            </Badge>
          </div>
        </div>

        {/* User Details */}
        <CardContent className="p-6 space-y-4">
          {/* Domaine and Serre */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Sprout className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Domaine</div>
              <div className="font-medium text-gray-900">{userInfo.domaine}</div>
              <div className="text-sm text-gray-600">{userInfo.serre}</div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Numéro de téléphone</div>
              <div className="font-medium text-gray-900">{userInfo.telephone}</div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Adresse e-mail</div>
              <div className="font-medium text-gray-900">{userInfo.email}</div>
            </div>
          </div>

          {/* Birthday */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Date de naissance</div>
              <div className="font-medium text-gray-900">{userInfo.birthday}</div>
            </div>
          </div>
        </CardContent>

        {/* Action Buttons */}
        <div className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
          <Button
            onClick={handleEditProfile}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier le profil
          </Button>
        </div>
      </Card>
        </div>
      </div>
  );
}
