import React, { useState, useEffect } from "react";
import { AlertTriangle, Eye, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Alert {
  id: number;
  id_bilan: number;
  status_alert: number;
  maladie: string;
  lien_image?: string;
  x1?: number;
  y1?: number;
  date: string;
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "résolue":
      return "bg-green-100 text-green-800 border-green-200";
    case "non résolue":
      return "bg-red-100 text-red-800 border-red-200";
    case "en cours":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getSeverityColor = (statusAlert: number) => {
  switch (statusAlert) {
    case 1:
      return "text-red-600";
    case 2:
      return "text-orange-600";
    case 3:
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
};

const getSeverityLabel = (statusAlert: number) => {
  switch (statusAlert) {
    case 1:
      return "Critique";
    case 2:
      return "Modérée";
    case 3:
      return "Faible";
    default:
      return "Inconnue";
  }
};

export default function Alerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "resolved" | "unresolved">("all");

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alertes");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        console.error("Failed to fetch alerts");
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/alertes/${alertId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error("Error updating alert status:", error);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    switch (filter) {
      case "resolved":
        return alert.status === "résolue";
      case "unresolved":
        return alert.status === "non résolue";
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greener-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Alertes Agricoles
          </h1>
          <p className="text-gray-600">
            Surveillance et gestion des alertes de santé des cultures
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Toutes ({alerts.length})
          </Button>
          <Button
            variant={filter === "unresolved" ? "default" : "outline"}
            onClick={() => setFilter("unresolved")}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Non résolues (
            {alerts.filter((a) => a.status === "non résolue").length})
          </Button>
          <Button
            variant={filter === "resolved" ? "default" : "outline"}
            onClick={() => setFilter("resolved")}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Résolues ({alerts.filter((a) => a.status === "résolue").length})
          </Button>
        </div>

        {/* Alerts Grid */}
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune alerte
              </h3>
              <p className="text-gray-500 text-center">
                {filter === "all"
                  ? "Aucune alerte n'a été détectée pour le moment."
                  : `Aucune alerte ${
                      filter === "resolved" ? "résolue" : "non résolue"
                    }.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAlerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">
                      Alerte #{alert.id}
                    </CardTitle>
                    <Badge
                      className={cn("text-xs font-medium", getStatusColor(alert.status))}
                    >
                      {alert.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {formatDate(alert.date)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Disease Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Maladie détectée</h4>
                    <p className="text-gray-700">{alert.maladie}</p>
                  </div>

                  {/* Severity */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      Sévérité
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        getSeverityColor(alert.status_alert)
                      )}
                    >
                      {getSeverityLabel(alert.status_alert)}
                    </span>
                  </div>

                  {/* Location */}
                  {alert.x1 !== undefined && alert.y1 !== undefined && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Position: </span>
                      ({alert.x1.toFixed(2)}, {alert.y1.toFixed(2)})
                    </div>
                  )}

                  {/* Bilan ID */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Bilan: </span>#{alert.id_bilan}
                  </div>

                  {/* Image */}
                  {alert.lien_image && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center gap-2"
                        onClick={() => window.open(alert.lien_image, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                        Voir l'image
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  {alert.status !== "résolue" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => updateAlertStatus(alert.id, "résolue")}
                      >
                        Marquer comme résolue
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
