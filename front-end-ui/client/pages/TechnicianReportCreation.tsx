import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Calendar,
  ArrowLeft,
  Save,
  Download,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReportService from "../services/reportService";
import { serreService } from "../services/serreService";

interface Serre {
  id: number;
  nom: string;
  domaine_nom?: string;
}

export default function TechnicianReportCreation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [selectedSerre, setSelectedSerre] = useState<string>("");
  const [description, setDescription] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  
  // Available serres for the technician
  const [availableSerres, setAvailableSerres] = useState<Serre[]>([]);

  useEffect(() => {
    fetchAvailableSerres();
  }, []);

  const fetchAvailableSerres = async () => {
    try {
      const serres = await serreService.getSerresByUser();
      setAvailableSerres(serres);
    } catch (error) {
      setError("Erreur lors du chargement des serres disponibles");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSerre || !description.trim()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reportData = {
        description: description.trim(),
        id_serre: parseInt(selectedSerre),
        date_debut: formatDateForBackend(dateDebut),
        date_fin: formatDateForBackend(dateFin),
        ids_bilans: [], // Will be automatically populated by backend based on serre
      };

      const response = await ReportService.createReport(reportData);
      
      setSuccess("Rapport généré avec succès !");
      
      // Redirect to reports page after a short delay
      setTimeout(() => {
        navigate("/technician/reports");
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || "Erreur lors de la création du rapport");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/technician/reports");
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const formatDateForBackend = (dateString: string) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return date.toISOString();
  };

  const getDefaultDateRange = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      start: formatDateForInput(oneWeekAgo),
      end: formatDateForInput(now)
    };
  };

  useEffect(() => {
    const { start, end } = getDefaultDateRange();
    setDateDebut(start);
    setDateFin(end);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header removed: provided by TechnicianLayout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Informations du Rapport</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Serre Selection */}
              <div>
                <Label htmlFor="serre" className="text-base font-medium">
                  Serre <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedSerre} onValueChange={setSelectedSerre}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Sélectionnez une serre" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSerres.map((serre) => (
                      <SelectItem key={serre.id} value={serre.id.toString()}>
                        <div>
                          <div className="font-medium">{serre.nom}</div>
                          {serre.domaine_nom && (
                            <div className="text-sm text-gray-500">
                              {serre.domaine_nom}
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Sélectionnez la serre pour laquelle vous souhaitez générer un rapport
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-debut" className="text-base font-medium">
                    Date de début
                  </Label>
                  <Input
                    id="date-debut"
                    type="datetime-local"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Date de début de la période d'analyse
                  </p>
                </div>

                <div>
                  <Label htmlFor="date-fin" className="text-base font-medium">
                    Date de fin
                  </Label>
                  <Input
                    id="date-fin"
                    type="datetime-local"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Date de fin de la période d'analyse
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Description du rapport <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le contenu et l'objectif de ce rapport..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 min-h-[120px]"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Décrivez brièvement le contenu et l'objectif de ce rapport
                </p>
              </div>

              {/* Preview Info */}
              {selectedSerre && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Aperçu du rapport
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>Serre:</strong> {availableSerres.find(s => s.id.toString() === selectedSerre)?.nom}
                    </p>
                    {dateDebut && dateFin && (
                      <p>
                        <strong>Période:</strong> {new Date(dateDebut).toLocaleDateString("fr-FR")} - {new Date(dateFin).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                    <p>
                      <strong>Généré par:</strong> {user?.name || "Technicien"}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedSerre || !description.trim()}
                  className="bg-[#B4CC5F] hover:bg-[#9BB84F] transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Génération...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="h-4 w-4" />
                      <span>Générer le Rapport</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
