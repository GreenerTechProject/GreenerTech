import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  LogOut, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Building,
  Users,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DirectorLayout from "@/components/DirectorLayout";
import { companyService, CompanyInfo } from "../services/companyService";

export default function DirectorProfile() {
  const { user, logout, deleteUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userInfo, setUserInfo] = useState<any>(null);
  const [enterpriseInfo, setEnterpriseInfo] = useState<CompanyInfo | null>(null);
  const [loadingEnterprise, setLoadingEnterprise] = useState(false);
  const [directorEnterprises, setDirectorEnterprises] = useState<CompanyInfo[]>([]);
  const [loadingDirectorEnterprises, setLoadingDirectorEnterprises] = useState(false);

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
      case "directeur":
        return "Directeur";
      case "technicien":
        return "Tech";
      case "technicien_superieur":
        return "Tech - Sup";
      default:
        return "Utilisateur";
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "directeur":
        return "bg-green-100 text-green-800";
      case "technicien":
        return "bg-blue-100 text-blue-800";
      case "technicien_superieur":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
        company: user.id_entreprise ? `Entreprise ${user.id_entreprise}` : "Non renseigné",
        employees: user.id_entreprise ? "Techniciens de l'entreprise" : "Non renseigné"
      };
      setUserInfo(formattedUser);

      // Fetch enterprise information if user has an enterprise ID
      if (user.id_entreprise) {
        fetchEnterpriseInfo(user.id_entreprise);
      }

      // Fetch enterprises created by the director
      if (user.role === 'directeur') {
        fetchDirectorEnterprises(Number(user.id));
      }
    }
  }, [user]);

  const fetchEnterpriseInfo = async (enterpriseId: number) => {
    try {
      setLoadingEnterprise(true);
      const enterprise = await companyService.getCompanyById(enterpriseId);
      setEnterpriseInfo(enterprise);
    } catch (error) {
      console.error("Error fetching enterprise info:", error);
    } finally {
      setLoadingEnterprise(false);
    }
  };

  const fetchDirectorEnterprises = async (directorId: number) => {
    try {
      setLoadingDirectorEnterprises(true);
      const enterprises = await companyService.getEnterprisesByDirector(directorId);
      setDirectorEnterprises(enterprises);
    } catch (error) {
      console.error("Error fetching director enterprises:", error);
    } finally {
      setLoadingDirectorEnterprises(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
              navigate("/");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = () => {
    navigate("/directeur/profile/edit");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      try {
        // Call the deleteUser method from AuthContext
        await deleteUser();
        
        // Show success message
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

    if (!userInfo) {
    return (
      <DirectorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greener-600"></div>
        </div>
      </DirectorLayout>
    );
  }

  return (
    <DirectorLayout>
      <div className="flex items-center justify-center p-4 pt-8">

          
          <Card className="w-full max-w-md shadow-lg border-0">
            {/* Green Header with User Info */}
            <div className="bg-greener-600 rounded-t-lg p-6 relative">
              {/* Profile Picture Placeholder */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 relative">
                <div className="text-2xl font-bold text-greener-600">
                  {userInfo.firstName ? userInfo.firstName[0] : 'U'}
                  {userInfo.lastName ? userInfo.lastName[0] : ''}
                </div>
                {/* Online status dot */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-greener-500 rounded-full border-2 border-white"></div>
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
              {/* Company and Employees */}
              {userInfo.id_entreprise ? (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-greener-100 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4 text-greener-700" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Entreprise</div>
                    <div className="font-medium text-gray-900">
                      {loadingEnterprise ? (
                        <span className="text-gray-400">Chargement...</span>
                      ) : enterpriseInfo ? (
                        enterpriseInfo.nom
                      ) : (
                        `Entreprise ${userInfo.id_entreprise}`
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {loadingEnterprise ? (
                        <span className="text-gray-400">Chargement...</span>
                      ) : enterpriseInfo ? (
                        enterpriseInfo.adresse || "Adresse non renseignée"
                      ) : (
                        "Techniciens de l'entreprise"
                      )}
                    </div>
                    {enterpriseInfo && enterpriseInfo.status_juridique && (
                      <div className="text-sm text-gray-500">
                        {enterpriseInfo.status_juridique}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Entreprise</div>
                    <div className="font-medium text-gray-900 text-gray-500">Aucune entreprise assignée</div>
                  </div>
                </div>
              )}

              {/* Phone Number */}
              {userInfo.telephone && userInfo.telephone !== "Non renseigné" && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Numéro de téléphone</div>
                    <div className="font-medium text-gray-900">{userInfo.telephone}</div>
                  </div>
                </div>
              )}

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
              {userInfo.birthday && userInfo.birthday !== "Non renseigné" && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Date de naissance</div>
                    <div className="font-medium text-gray-900">{userInfo.birthday}</div>
                  </div>
                </div>
              )}

              {/* CIN */}
              {userInfo.cin && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">CIN</div>
                    <div className="font-medium text-gray-900">{userInfo.cin}</div>
                  </div>
                </div>
              )}

              {/* Enterprises Created by Director */}
              {userInfo.role === 'directeur' && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mt-1">
                    <Building className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Entreprises créées</div>
                    {loadingDirectorEnterprises ? (
                      <div className="text-sm text-gray-400">Chargement...</div>
                    ) : directorEnterprises.length > 0 ? (
                      directorEnterprises.map((enterprise, index) => (
                        <div key={index} className="mb-2 p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-900">{enterprise.nom}</div>
                          {enterprise.adresse && (
                            <div className="text-sm text-gray-600">{enterprise.adresse}</div>
                          )}
                          {enterprise.status_juridique && (
                            <div className="text-sm text-gray-500">{enterprise.status_juridique}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                        Aucune entreprise créée pour le moment
                      </div>
                    )}
                  </div>
                </div>
              )}

            </CardContent>

            {/* Action Buttons */}
            <div className="p-6 pt-0 space-y-3">
              <Button 
                onClick={handleEditProfile}
                className="w-full bg-greener-600 hover:bg-greener-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier le profil
              </Button>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>

              <Button 
                onClick={handleDeleteAccount}
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer le compte
              </Button>
            </div>
          </Card>
        </div>
      </DirectorLayout>
    );
  }
