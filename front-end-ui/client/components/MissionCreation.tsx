import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { robotService } from '../services/robotService';
import { serreService } from '../services/serreService';
import { missionService } from '../services/missionService';
import { toast } from 'sonner';
import { tokenManager } from '../services/authService';

interface MissionCreationProps {
  onMissionCreated?: () => void;
}

interface Robot {
  id: number;
  nom: string;
  referance: string;
}

interface Serre {
  id: number;
  nom: string;
  id_domaine?: number;
  surface?: number;
  domaine_nom?: string;
}

interface MissionFormData {
  id_robot: number;
  id_serre: number;
  missionType: 'date' | 'repetition';
  // Date-based mission fields
  date_debut: Date | null;
  date_fin: Date | null;
  date_heure: number | null; // Hour for date-based missions (0-23)
  date_minute: number | null; // Minute for date-based missions (0-59)
  // Repetition-based mission fields
  rep_jr: number;
  rep_sem: number;
  jour: number | null;  // Day of week (1=lundi, 2=mardi, etc.)
  heure: number | null; // Hour (0-23)
  minute: number | null; // Minute (0-59)
}

export const MissionCreation: React.FC<MissionCreationProps> = ({ onMissionCreated }) => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [loading, setLoading] = useState(false);
  const [robotsLoading, setRobotsLoading] = useState(false);
  const [serresLoading, setSerresLoading] = useState(false);
  const [formData, setFormData] = useState<MissionFormData>({
    id_robot: 0,
    id_serre: 0,
    missionType: 'date',
    date_debut: null,  // Start with null, not new Date()
    date_fin: null,
    date_heure: null,
    date_minute: null,
    rep_jr: 1,
    rep_sem: 1,
    jour: null,
    heure: null,
    minute: null,
  });

  useEffect(() => {
    fetchRobots();
    fetchSerres();
  }, []);

  // Update formData when robots/serres are loaded to show first available option
  useEffect(() => {
    if (robots.length > 0 && formData.id_robot === 0) {
      setFormData(prev => ({ ...prev, id_robot: robots[0].id }));
    }
  }, [robots]);

  useEffect(() => {
    if (serres.length > 0 && formData.id_serre === 0) {
      setFormData(prev => ({ ...prev, id_serre: serres[0].id }));
    }
  }, [serres]);

  const fetchRobots = async () => {
    setRobotsLoading(true);
    try {
      const robotsData = await robotService.getAllRobots();
      setRobots(robotsData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des robots:', error);
      toast.error(`Erreur lors de la récupération des robots: ${error.message}`);
    } finally {
      setRobotsLoading(false);
    }
  };

  const fetchSerres = async () => {
    setSerresLoading(true);
    try {
      const serresData = await serreService.getSerresByCurrentUser();
      setSerres(serresData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des serres:', error);
      toast.error(`Erreur lors de la récupération des serres: ${error.message}`);
    } finally {
      setSerresLoading(false);
    }
  };

  const handleInputChange = (field: keyof MissionFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear date fields when switching to repetition mode
      if (field === 'missionType' && value === 'repetition') {
        newData.date_debut = null;
        newData.date_fin = null;
        newData.date_heure = null;
        newData.date_minute = null;
      }

      // Clear repetition fields when switching to date mode
      if (field === 'missionType' && value === 'date') {
        newData.rep_jr = 0;
        newData.rep_sem = 0;
        newData.jour = null;
        newData.heure = null;
        newData.minute = null;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_robot || !formData.id_serre) {
      toast.error('Veuillez sélectionner un robot et une serre');
      return;
    }

    // Validate based on mission type
    if (formData.missionType === 'date') {
      if (!formData.date_debut) {
        toast.error('Veuillez sélectionner une date de début pour la mission');
        return;
      }
      if (formData.date_heure === null || formData.date_minute === null) {
        toast.error('Veuillez sélectionner une heure et une minute pour la mission');
        return;
      }
    }

    if (formData.missionType === 'repetition') {
      if (formData.rep_jr < 1 && formData.rep_sem < 1) {
        toast.error('Veuillez configurer au moins une répétition (journalière ou hebdomadaire)');
        return;
      }
      
      if (formData.rep_sem >= 1 && (!formData.jour || formData.heure === null || formData.minute === null)) {
        toast.error('Pour les répétitions hebdomadaires, veuillez sélectionner un jour, une heure et une minute');
        return;
      }
      
      if (formData.rep_jr >= 1 && (formData.heure === null || formData.minute === null)) {
        toast.error('Pour les répétitions journalières, veuillez sélectionner une heure et une minute');
        return;
      }
    }

    setLoading(true);
    try {
      let missionData: any = {
        id_robot: formData.id_robot,
        id_serre: formData.id_serre,
        executed: false
      };

      // Add fields based on mission type
      if (formData.missionType === 'date') {
        // Combine date and time for date-based missions
        if (formData.date_debut && formData.date_heure !== null && formData.date_minute !== null) {
          const combinedDateTime = new Date(formData.date_debut);
          combinedDateTime.setHours(formData.date_heure, formData.date_minute, 0, 0);
          missionData.date_debut = combinedDateTime.toISOString();
        }
        missionData.date_fin = formData.date_fin?.toISOString() || null;
        // Set repetition to 0 for date-based missions
        missionData.rep_jr = 0;
        missionData.rep_sem = 0;
        // Clear time fields for date-based missions
        missionData.jour = null;
        missionData.heure = null;
        missionData.minute = null;
      } else {
        // Repetition-based mission
        missionData.rep_jr = formData.rep_jr;
        missionData.rep_sem = formData.rep_sem;
        missionData.jour = formData.jour;
        missionData.heure = formData.heure;
        missionData.minute = formData.minute;
        // Set date to null for repetition-based missions
        missionData.date_debut = null;
        missionData.date_fin = null;
      }

      console.log('Sending mission data to backend:', missionData);
      console.log('Form data state:', formData);
      await missionService.createMission(missionData);
      toast.success('Mission créée avec succès!');
      
      // Reset form
      setFormData({
        id_robot: 0,
        id_serre: 0,
        missionType: 'date',
        date_debut: null,
        date_fin: null,
        date_heure: null,
        date_minute: null,
        rep_jr: 1,
        rep_sem: 1,
        jour: null,
        heure: null,
        minute: null,
      });

      // Call the callback if provided
      if (onMissionCreated) {
        onMissionCreated();
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la mission:', error);
      toast.error(error.message || 'Erreur lors de la création de la mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Créer une nouvelle mission</CardTitle>
        <CardDescription>
          Configurez une mission pour un robot dans une serre à laquelle vous avez accès. 
          Choisissez entre une mission à date spécifique ou une mission répétitive.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Robot Selection */}
          <div className="space-y-2">
            <Label htmlFor="robot">Robot *</Label>
            <Select
              value={formData.id_robot > 0 ? formData.id_robot.toString() : ""}
              onValueChange={(value) => handleInputChange('id_robot', parseInt(value))}
              disabled={robotsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={robotsLoading ? "Chargement des robots..." : "Sélectionnez un robot"}>
                  {formData.id_robot > 0 && robots.length > 0 && (
                    (() => {
                      const selectedRobot = robots.find(r => r.id === formData.id_robot);
                      return selectedRobot ? `${selectedRobot.nom} - ${selectedRobot.referance}` : "Sélectionnez un robot";
                    })()
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                {robots.length === 0 && !robotsLoading ? (
                  <SelectItem value="none" disabled>
                    Aucun robot disponible
                  </SelectItem>
                ) : (
                  robots.map((robot) => (
                    <SelectItem key={robot.id} value={robot.id.toString()}>
                      {robot.nom} - {robot.referance}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {robotsLoading && <p className="text-sm text-muted-foreground">Chargement des robots...</p>}
            {robots.length === 0 && !robotsLoading && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-red-500">Aucun robot trouvé</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchRobots}
                  disabled={robotsLoading}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>

          {/* Serre Selection */}
          <div className="space-y-2">
            <Label htmlFor="serre">Serre *</Label>
            <Select
              value={formData.id_serre > 0 ? formData.id_serre.toString() : ""}
              onValueChange={(value) => handleInputChange('id_serre', parseInt(value))}
              disabled={serresLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={serresLoading ? "Chargement des serres..." : "Sélectionnez une serre"}>
                  {formData.id_serre > 0 && serres.length > 0 && (
                    (() => {
                      const selectedSerre = serres.find(s => s.id === formData.id_serre);
                      return selectedSerre ? `${selectedSerre.nom}${selectedSerre.domaine_nom ? ` (${selectedSerre.domaine_nom})` : ''}` : "Sélectionnez une serre";
                    })()
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                {serres.length === 0 && !serresLoading ? (
                  <SelectItem value="none" disabled>
                    Aucune serre disponible
                  </SelectItem>
                ) : (
                  serres.map((serre) => (
                    <SelectItem key={serre.id} value={serre.id.toString()}>
                      {serre.nom} {serre.domaine_nom && `(${serre.domaine_nom})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {serresLoading && <p className="text-sm text-muted-foreground">Chargement des serres...</p>}
            {serres.length === 0 && !serresLoading && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-red-500">Aucune serre trouvée</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchSerres}
                  disabled={serresLoading}
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>

          {/* Mission Type Selection */}
          <div className="space-y-2">
            <Label>Type de mission</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="missionType"
                  value="date"
                  checked={formData.missionType === 'date'}
                  onChange={(e) => handleInputChange('missionType', e.target.value as 'date' | 'repetition')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Mission à date spécifique</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="missionType"
                  value="repetition"
                  checked={formData.missionType === 'repetition'}
                  onChange={(e) => handleInputChange('missionType', e.target.value as 'date' | 'repetition')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm">Mission répétitive</span>
              </label>
            </div>
            

          </div>

          {/* Repetition Settings - Only show for repetition missions */}
          {formData.missionType === 'repetition' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rep_jr">Répétition journalière</Label>
                  <Input
                    id="rep_jr"
                    type="number"
                    min="1"
                    value={formData.rep_jr}
                    onChange={(e) => handleInputChange('rep_jr', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep_sem">Répétition hebdomadaire</Label>
                  <Input
                    id="rep_sem"
                    type="number"
                    min="1"
                    value={formData.rep_sem}
                    onChange={(e) => handleInputChange('rep_sem', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
              
              {/* Time and Day Selection for Repetition */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jour">Jour de la semaine</Label>
                  <Select
                    value={formData.jour?.toString() || ""}
                    onValueChange={(value) => handleInputChange('jour', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un jour" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="2">Mardi</SelectItem>
                      <SelectItem value="3">Mercredi</SelectItem>
                      <SelectItem value="4">Jeudi</SelectItem>
                      <SelectItem value="5">Vendredi</SelectItem>
                      <SelectItem value="6">Samedi</SelectItem>
                      <SelectItem value="7">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heure">Heure</Label>
                  <Select
                    value={formData.heure?.toString() || ""}
                    onValueChange={(value) => handleInputChange('heure', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez l'heure" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minute">Minute</Label>
                  <Select
                    value={formData.minute?.toString() || ""}
                    onValueChange={(value) => handleInputChange('minute', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la minute" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      {Array.from({ length: 60 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Date Settings - Only show for date missions */}
          {formData.missionType === 'date' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.date_debut ? formData.date_debut.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      handleInputChange('date_debut', date);
                    }}
                      className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date de fin (optionnel)</Label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.date_fin ? formData.date_fin.toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      handleInputChange('date_fin', date);
                    }}
                      min={formData.date_debut ? formData.date_debut.toISOString().split('T')[0] : undefined}
                      className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Time Selection for Date-based Missions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_heure">Heure d'exécution *</Label>
                  <Select
                    value={formData.date_heure?.toString() || ""}
                    onValueChange={(value) => handleInputChange('date_heure', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez l'heure" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_minute">Minute d'exécution *</Label>
                  <Select
                    value={formData.date_minute?.toString() || ""}
                    onValueChange={(value) => handleInputChange('date_minute', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez la minute" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                      {Array.from({ length: 60 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !formData.id_robot || !formData.id_serre ||
              (formData.missionType === 'date' && (!formData.date_debut || formData.date_heure === null || formData.date_minute === null)) ||
              (formData.missionType === 'repetition' && (
                (formData.rep_jr < 1 && formData.rep_sem < 1) ||
                (formData.rep_sem >= 1 && (!formData.jour || formData.heure === null || formData.minute === null)) ||
                (formData.rep_jr >= 1 && (formData.heure === null || formData.minute === null))
              ))}
          >
            {loading ? 'Création en cours...' : 'Créer la mission'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
