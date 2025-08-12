import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Navigation, Target, Play, Pause, Square, CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import { BilanPoint, bilanService } from '../services/bilanService';
import BilanMapComponent from './BilanMapComponent';

interface BilanCreationProps {
  serreId: number;
  serreName: string;
  serreLocation: { lat: number; lng: number };
  onBilanCreated: () => void;
  onCancel: () => void;
}

export default function BilanCreation({
  serreId,
  serreName,
  serreLocation,
  onBilanCreated,
  onCancel,
}: BilanCreationProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<BilanPoint[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bilanName, setBilanName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const locationHistoryRef = useRef<{ lat: number; lng: number; timestamp: number }[]>([]);

  // Get current location when component mounts
  useEffect(() => {
    getCurrentLocation();
    // Set default bilan name
    setBilanName(`Bilan ${serreName} - ${new Date().toLocaleDateString()}`);
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [serreName]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setError(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError("Impossible d'obtenir votre position actuelle");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    setIsTracking(true);
    setError(null);
    setSuccess("Suivi GPS activé. Marchez dans le champ pour créer votre bilan.");

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setCurrentLocation(newLocation);
        
        // Add to history for path tracking
        locationHistoryRef.current.push({
          ...newLocation,
          timestamp: Date.now(),
        });

        // Keep only last 100 points to avoid memory issues
        if (locationHistoryRef.current.length > 100) {
          locationHistoryRef.current = locationHistoryRef.current.slice(-100);
        }
      },
      (error) => {
        console.error('Error watching location:', error);
        setError("Erreur lors du suivi GPS");
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setSuccess("Suivi GPS arrêté");
  };

  const addCurrentPosition = () => {
    if (!currentLocation) {
      setError("Position actuelle non disponible");
      return;
    }

    const newPoint: BilanPoint = {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      ordre: selectedPoints.length + 1,
    };

    setSelectedPoints(prev => [...prev, newPoint]);
    setSuccess(`Point ${newPoint.ordre} ajouté à la position actuelle`);
    setError(null);

    // Auto-stop tracking after 4 points
    if (selectedPoints.length + 1 >= 4) {
      stopTracking();
      setSuccess("4 points sélectionnés ! Vous pouvez maintenant créer le bilan.");
    }
  };

  const removeLastPoint = () => {
    if (selectedPoints.length > 0) {
      setSelectedPoints(prev => prev.slice(0, -1));
      setSuccess("Dernier point supprimé");
    }
  };

  const resetPoints = () => {
    setSelectedPoints([]);
    setSuccess("Tous les points ont été réinitialisés");
    setError(null);
  };

  const calculateArea = (): number => {
    if (selectedPoints.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < selectedPoints.length; i++) {
      const j = (i + 1) % selectedPoints.length;
      area += selectedPoints[i].lat * selectedPoints[j].lng;
      area -= selectedPoints[j].lat * selectedPoints[i].lng;
    }
    return Math.abs(area) / 2 * 111000 * 111000; // Convert to square meters (approximate)
  };

  const calculateCenter = () => {
    if (selectedPoints.length === 0) return null;
    
    const avgLat = selectedPoints.reduce((sum, point) => sum + point.lat, 0) / selectedPoints.length;
    const avgLng = selectedPoints.reduce((sum, point) => sum + point.lng, 0) / selectedPoints.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  const handleCreateBilan = () => {
    setShowConfirmation(true);
  };

  const createBilan = async () => {
    if (!bilanName.trim()) {
      setError("Veuillez entrer un nom pour le bilan");
      return;
    }

    if (selectedPoints.length < 3) {
      setError("Vous devez sélectionner au moins 3 points pour créer un bilan");
      return;
    }

    setIsCreating(true);
    setError(null);
    setShowConfirmation(false);

    try {
      const bilanData = {
        name: bilanName.trim(),
        id_serre: serreId,
        path: selectedPoints,
        area: calculateArea(),
        center: calculateCenter() || undefined,
      };

      await bilanService.createBilan(bilanData);
      setSuccess("Bilan créé avec succès !");
      
      // Wait a moment to show success message
      setTimeout(() => {
        onBilanCreated();
      }, 1500);
    } catch (error: any) {
      console.error('Error creating bilan:', error);
      setError(error.message || "Erreur lors de la création du bilan");
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateBilan = selectedPoints.length >= 3 && !isCreating && bilanName.trim();

  // Debug logging
  useEffect(() => {
    console.log('BilanCreation Debug:', {
      selectedPoints: selectedPoints.length,
      isCreating,
      bilanName: bilanName.trim(),
      canCreateBilan,
      hasName: !!bilanName.trim(),
      hasPoints: selectedPoints.length >= 3
    });
  }, [selectedPoints.length, isCreating, bilanName, canCreateBilan]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <Card className="w-full h-full max-w-none sm:max-w-6xl sm:max-h-[90vh] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b p-4 sm:p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-bold truncate">Création de Bilan GPS</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-normal truncate">
                    Serre: {serreName} • Marchez dans le champ pour marquer les positions
                  </div>
                </div>
              </CardTitle>
              
              {/* Close Button */}
              <Button
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-200 flex-shrink-0 ml-2"
                disabled={isCreating}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 flex-1 min-h-0">
              {/* Left Panel - Controls and Status */}
              <div className="lg:col-span-1 border-r border-b lg:border-b-0 bg-gray-50 flex flex-col overflow-hidden">
                {/* Scrollable Content Area */}
                <div 
                  className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 border-l-2 border-blue-200"
                  style={{
                    maxHeight: 'calc(100vh - 200px)',
                    minHeight: '400px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E0 #F7FAFC',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'auto'
                  }}
                >
                  {/* Scroll Indicator */}
                  <div className="sticky top-0 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-3 text-center z-10">
                    📜 Zone défilable - Utilisez la molette ou les flèches pour naviguer
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6 pb-4">
                    {/* Bilan Name Input */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-base sm:text-lg">Nom du Bilan</h3>
                      <div className="space-y-2">
                        <Label htmlFor="bilanName" className="text-sm sm:text-base">Nom *</Label>
                        <Input
                          id="bilanName"
                          value={bilanName}
                          onChange={(e) => setBilanName(e.target.value)}
                          placeholder="Ex: Bilan Nord-Est - Juin 2024"
                          className="w-full text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* GPS Status */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                        <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                        Statut GPS
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Position actuelle:</span>
                          <Badge variant={currentLocation ? "default" : "secondary"} className="text-xs">
                            {currentLocation ? "Disponible" : "Non disponible"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Suivi actif:</span>
                          <Badge variant={isTracking ? "default" : "secondary"} className="text-xs">
                            {isTracking ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>

                      {currentLocation && (
                        <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                          Lat: {currentLocation.lat.toFixed(6)}<br />
                          Lng: {currentLocation.lng.toFixed(6)}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* GPS Controls */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-base sm:text-lg">Contrôles GPS</h3>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {!isTracking ? (
                          <Button 
                            onClick={startTracking}
                            className="w-full text-xs sm:text-sm"
                            disabled={!currentLocation}
                            size="sm"
                          >
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Démarrer
                          </Button>
                        ) : (
                          <Button 
                            onClick={stopTracking}
                            variant="outline"
                            className="w-full text-xs sm:text-sm"
                            size="sm"
                          >
                            <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            Arrêter
                          </Button>
                        )}
                        
                        <Button 
                          onClick={getCurrentLocation}
                          variant="outline"
                          className="w-full text-xs sm:text-sm"
                          size="sm"
                        >
                          <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Actualiser
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Point Management */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-base sm:text-lg">Gestion des Points</h3>
                      
                      <div className="space-y-2">
                        <Button 
                          onClick={addCurrentPosition}
                          className="w-full text-xs sm:text-sm"
                          disabled={!currentLocation || !isTracking || selectedPoints.length >= 4}
                          size="sm"
                        >
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Ajouter Point {selectedPoints.length + 1}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            onClick={removeLastPoint}
                            variant="outline"
                            size="sm"
                            disabled={selectedPoints.length === 0}
                            className="text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                          
                          <Button 
                            onClick={resetPoints}
                            variant="outline"
                            size="sm"
                            disabled={selectedPoints.length === 0}
                            className="text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Réinitialiser
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Points Summary */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-base sm:text-lg">Résumé des Points</h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Points sélectionnés:</span>
                          <Badge variant="outline" className="text-xs">{selectedPoints.length}/4</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Surface estimée:</span>
                          <span className="text-sm font-medium">
                            {calculateArea().toFixed(1)} m²
                          </span>
                        </div>
                      </div>

                      {selectedPoints.length > 0 && (
                        <div className="border rounded p-2 bg-white max-h-24 sm:max-h-32 overflow-y-auto">
                          <div className="space-y-1">
                            {selectedPoints.map((point, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <Badge variant="secondary" className="text-xs">
                                  {point.ordre}
                                </Badge>
                                <span className="text-gray-600 truncate">
                                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Debug Info */}
                    <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-md text-xs">
                      <div className="font-medium text-blue-800 mb-2">État du formulaire:</div>
                      <div className="space-y-1 text-blue-700">
                        <div>• Nom saisi: {bilanName ? '✅' : '❌'} "{bilanName}"</div>
                        <div>• Points: {selectedPoints.length}/4 {selectedPoints.length >= 3 ? '✅' : '❌'}</div>
                        <div>• En cours de création: {isCreating ? 'Oui' : 'Non'}</div>
                        <div>• Peut créer: {canCreateBilan ? '✅ Oui' : '❌ Non'}</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Actions - Always at the bottom */}
                    <div className="space-y-3 pt-2">
                      {/* Create Bilan Button */}
                      <Button 
                        onClick={handleCreateBilan}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        disabled={!canCreateBilan}
                        size="lg"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {isCreating ? "Création en cours..." : "Créer le Bilan"}
                      </Button>
                      
                      {/* Alternative Save Button */}
                      <Button 
                        onClick={handleCreateBilan}
                        variant="outline"
                        className="w-full border-green-600 text-green-600 hover:bg-green-50"
                        disabled={!canCreateBilan}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sauvegarder le Bilan
                      </Button>
                      
                      {/* Test Button - Direct Creation */}
                      <Button 
                        onClick={() => {
                          if (canCreateBilan) {
                            createBilan();
                          } else {
                            setError("Conditions non remplies pour créer le bilan");
                          }
                        }}
                        variant="secondary"
                        className="w-full"
                        size="sm"
                      >
                        🧪 Test - Créer Directement
                      </Button>
                      
                      {/* Cancel Button */}
                      <Button 
                        onClick={onCancel}
                        variant="outline"
                        className="w-full"
                        disabled={isCreating}
                      >
                        Annuler
                      </Button>
                    </div>

                    {/* Messages */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                    
                    {success && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-600">{success}</p>
                      </div>
                    )}

                    {/* Spacer to ensure buttons are reachable */}
                    <div className="h-4"></div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Map */}
              <div className="lg:col-span-2 h-full min-h-[300px] sm:min-h-[400px]">
                <BilanMapComponent
                  serreLocation={serreLocation}
                  selectedPoints={selectedPoints}
                  currentLocation={currentLocation}
                  isTracking={isTracking}
                  className="h-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la création du bilan</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir créer le bilan "{bilanName}" ?
              <br /><br />
              <strong>Détails du bilan :</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Serre : {serreName}</li>
                <li>• Points sélectionnés : {selectedPoints.length}/4</li>
                <li>• Surface estimée : {calculateArea().toFixed(1)} m²</li>
                <li>• Nom : {bilanName}</li>
              </ul>
              <br />
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={createBilan}
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? "Création..." : "Créer le Bilan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
