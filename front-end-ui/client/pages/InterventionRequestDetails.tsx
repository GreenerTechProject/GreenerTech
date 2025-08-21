import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  AlertTriangle,
  Building,
  Calendar,
  DollarSign,
  ArrowLeft
} from "lucide-react";
import { InterventionService, Intervention } from "../services/interventionService";
import { notificationService, Notification } from "../services/notificationService";
import { useToast } from "../hooks/use-toast";

export default function InterventionRequestDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationMeta, setNotificationMeta] = useState<Notification | null>(null);

  const notificationId = searchParams.get('notificationId');

  useEffect(() => {
    if (id) {
      fetchIntervention();
    }
  }, [id]);

  useEffect(() => {
    const nid = notificationId ? parseInt(notificationId) : undefined;
    if (!nid) return;
    (async () => {
      try {
        const list = await notificationService.getNotifications();
        const match = list.find(n => n.id === nid);
        if (match) setNotificationMeta(match);
      } catch (_) {}
    })();
  }, [notificationId]);

  const fetchIntervention = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InterventionService.getIntervention(parseInt(id!));
      setIntervention(data);
    } catch (error) {
      console.error("Error fetching intervention:", error);
      setError("Impossible de charger les détails de l'intervention");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!intervention) return;
    
    try {
      setProcessing(true);
      await InterventionService.validateIntervention(intervention.id);
      
      toast({
        title: "Intervention validée",
        description: "L'intervention a été validée avec succès",
        variant: "default",
      });

      // Mark notification as read if it exists
      if (notificationId) {
        try {
          await notificationService.markAsSeen(parseInt(notificationId));
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }

      // Navigate back to notifications
      navigate("/technicien-sup/notifications");
    } catch (error) {
      console.error("Error validating intervention:", error);
      toast({
        title: "Erreur",
        description: "Impossible de valider l'intervention",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!intervention || !rejectReason.trim()) return;
    
    try {
      setProcessing(true);
      await InterventionService.rejectIntervention(intervention.id, rejectReason);
      
      toast({
        title: "Intervention rejetée",
        description: "L'intervention a été rejetée avec succès",
        variant: "default",
      });

      // Mark notification as read if it exists
      if (notificationId) {
        try {
          await notificationService.markAsSeen(parseInt(notificationId));
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }

      // Navigate back to notifications
      navigate("/technicien-sup/notifications");
    } catch (error) {
      console.error("Error rejecting intervention:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'intervention",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setShowRejectDialog(false);
      setRejectReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'encours':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'terminé':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'rejetee':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejetée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "Intervention non trouvée"}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate("/technicien-sup/notifications")}
          className="mt-4"
        >
          Retour aux notifications
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/technicien-sup/notifications")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux notifications
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demande d'intervention #{intervention.id}
        </h1>
        <p className="text-gray-600">
          Détails de la demande d'intervention
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Intervention #{intervention.id}</CardTitle>
              <CardDescription>
                Demande créée le {new Date(intervention.created_at || intervention.date_debut).toLocaleDateString('fr-FR')}
                {notificationMeta && (
                  <>
                    {" • "}Notification reçue le {new Date(notificationMeta.date).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </>
                )}
              </CardDescription>
            </div>
            {getStatusBadge(intervention.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Description de l'intervention
            </div>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {intervention.description}
            </p>
          </div>

          {/* Technician Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Technicien demandeur
            </div>
            <p className="text-gray-900">{intervention.technician_name || `Utilisateur #${intervention.id_user}`}</p>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building className="h-4 w-4" />
                Serre
              </div>
              <p className="text-gray-900">{intervention.serre_nom || `Serre #${intervention.id_serre}`}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                Domaine
              </div>
              <p className="text-gray-900">{intervention.domaine_nom || "Non spécifié"}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4" />
                Type de tâche
              </div>
              <p className="text-gray-900">{intervention.type_nom || `Type #${intervention.id_type_tache}`}</p>
            </div>
          </div>

          {/* Dates and Costs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                Date de début
              </div>
              <p className="text-gray-900">
                {new Date(intervention.date_debut).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            {intervention.date_fin && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4" />
                  Date de fin
                </div>
                <p className="text-gray-900">
                  {new Date(intervention.date_fin).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            
                         <div className="space-y-2">
               <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                 <DollarSign className="h-4 w-4" />
                 Coût total
               </div>
               <p className="text-gray-900">
                 {intervention.total_charges ? `${intervention.total_charges.toFixed(2)} MAD` : "Non spécifié"}
               </p>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              onClick={handleValidate}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Valider la demande
            </Button>
            
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={processing}
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter la demande
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rejeter la demande d'intervention</DialogTitle>
                  <DialogDescription>
                    Veuillez fournir une raison pour le rejet de cette demande.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Raison du rejet..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(false)}
                    disabled={processing}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || processing}
                    variant="destructive"
                  >
                    Rejeter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
