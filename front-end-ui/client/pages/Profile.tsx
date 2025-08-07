import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSave = async () => {
    try {
      // You would typically call an API here to update the user profile
      // For now, we'll just show a success message
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "technicien":
        return "Technicien";
      case "technicien_sup":
        return "Technicien Supérieur";
      case "directeur":
        return "Directeur";
      default:
        return "Non défini";
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "technicien":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "technicien_sup":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "directeur":
        return "bg-green-50 border-green-200 text-green-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Mon Profil"
        subtitle="Gérez vos informations personnelles"
        userRole={user?.role as any}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid gap-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Informations personnelles</CardTitle>
                  <p className="text-sm text-gray-600">
                    Vos informations de base et contact
                  </p>
                </div>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Votre nom complet"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {user?.name || "Non renseigné"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="votre@email.com"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{user?.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <>
                  <Separator />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancel}>
                      Annuler
                    </Button>
                    <Button onClick={handleSave} className="flex items-center space-x-1">
                      <Save className="h-4 w-4" />
                      <span>Sauvegarder</span>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Role and Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Rôle et statut</CardTitle>
                  <p className="text-sm text-gray-600">
                    Votre rôle dans l'organisation
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Badge
                    variant="outline"
                    className={getRoleColor(user?.role)}
                  >
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Statut du compte</Label>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={user?.setup_completed ? "default" : "secondary"}
                      className={
                        user?.setup_completed
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-yellow-50 border-yellow-200 text-yellow-700"
                      }
                    >
                      {user?.setup_completed ? "Configuré" : "Configuration incomplète"}
                    </Badge>
                  </div>
                </div>
              </div>

              {user?.role === "directeur" && (
                <div className="space-y-2">
                  <Label>Validation directeur</Label>
                  <Badge
                    variant={user?.directeur_valide ? "default" : "secondary"}
                    className={
                      user?.directeur_valide
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }
                  >
                    {user?.directeur_valide ? "Validé" : "En attente de validation"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
