import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Building2,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { companyService } from "../services/companyService";

export default function TechnicienSupProfile() {
  const { user, deleteUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndCompanyData = async () => {
      if (user) {
        try {
          setLoading(true);
          
          // Fetch company data for the user via company ID
          let companyData = null;
          try {
            const companyId = user.id_entreprise != null ? Number(user.id_entreprise) : undefined;
            if (companyId) {
              companyData = await companyService.getCompanyById(companyId);
            }
          } catch (error) {
            // Could not fetch company data
          }

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
          };
          
          setUserInfo(formattedUser);
          setCompanyInfo(companyData);
        } catch (error) {
          toast({
            title: "Erreur",
            description: "Erreur lors du chargement des données",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserAndCompanyData();
  }, [user, toast]);

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
        return "bg-green-100 text-green-800";
      case "technicien_superieur":
        return "bg-green-100 text-green-800";
      case "directeur":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEditProfile = () => {
    navigate("/technicien-sup/profile/edit");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      try {
        await deleteUser();
        toast({
          title: "Compte supprimé",
          description: "Votre compte a été supprimé avec succès",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression du compte",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Impossible de charger les données utilisateur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center p-4">
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/technicien-sup")}
            className="text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        
        <Card className="w-full max-w-md shadow-lg border-0">
          {/* Green Header with User Info */}
          <div className="bg-green-600 rounded-t-lg p-6 relative">
            {/* Profile Picture Placeholder */}
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
            {/* Company Information */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Entreprise</div>
                <div className="font-medium text-gray-900">{companyInfo?.nom || companyInfo?.name || "Non renseigné"}</div>
                {companyInfo?.adresse && (
                  <div className="text-sm text-gray-600">{companyInfo.adresse}</div>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-green-600" />
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
          <div className="p-6 pt-0 flex flex-col space-y-3">
            <Button
              onClick={handleEditProfile}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier le profil
            </Button>
            
            <Button 
              onClick={handleDeleteAccount}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer le compte
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
