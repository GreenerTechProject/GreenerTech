import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface LogoutWithWarningProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function LogoutWithWarning({
  variant = "outline",
  size = "sm",
  className = ""
}: LogoutWithWarningProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <AlertDialogTitle>Attention - Données non sauvegardées</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-2">
            <p>
              Vous êtes sur le point de vous déconnecter pendant le processus de configuration de votre entreprise.
            </p>
            <p className="font-medium text-red-600">
              ⚠️ Toutes les données que vous avez saisies jusqu'à présent seront perdues définitivement.
            </p>
            <p>
              Pour sauvegarder votre configuration, veuillez d'abord finaliser le processus en cliquant sur "Finaliser la configuration" à la dernière étape.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col space-y-2 sm:flex-col">
          <AlertDialogCancel className="w-full sm:w-full">
            Continuer la configuration
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="w-full sm:w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Déconnexion en cours..." : "Se déconnecter quand même"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
