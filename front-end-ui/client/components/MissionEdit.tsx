import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { missionService } from '../services/missionService';
import { robotService } from '../services/robotService';
import { serreService } from '../services/serreService';

interface Mission {
  id: number;
  id_robot: number;
  id_serre: number;
  date_debut: string | null;
  date_fin: string | null;
  rep_jr: number;
  rep_sem: number;
  jour: number | null;
  heure: number | null;
  minute: number | null;
  executed: boolean;
}

interface Robot {
  id: number;
  nom: string;
  referance: string;
}

interface Serre {
  id: number;
  nom: string;
  surface: number;
}

interface MissionEditProps {
  mission: Mission;
  onMissionUpdated: () => void;
  onCancel: () => void;
}

export const MissionEdit: React.FC<MissionEditProps> = ({ mission, onMissionUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    id_robot: mission.id_robot,
    id_serre: mission.id_serre,
    date_debut: mission.date_debut ? mission.date_debut.split('T')[0] : '',
    date_fin: mission.date_fin ? mission.date_fin.split('T')[0] : '',
    date_heure: mission.date_debut ? new Date(mission.date_debut).getHours() : null,
    date_minute: mission.date_debut ? new Date(mission.date_debut).getMinutes() : null,
    rep_jr: mission.rep_jr,
    rep_sem: mission.rep_sem,
    jour: mission.jour || 0,
    heure: mission.heure || 0,
    minute: mission.minute || 0,
    executed: mission.executed
  });

  const [missionType, setMissionType] = useState<'date' | 'repetition'>(
    mission.date_debut ? 'date' : 'repetition'
  );

  const [robots, setRobots] = useState<Robot[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [robotsLoading, setRobotsLoading] = useState(false);
  const [serresLoading, setSerresLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRobots();
    fetchSerres();
  }, []);

  const fetchRobots = async () => {
    setRobotsLoading(true);
    try {
      const robotsData = await robotService.getAllRobots();
      if (Array.isArray(robotsData)) {
        setRobots(robotsData);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des robots:', error);
      toast.error('Erreur lors de la récupération des robots');
    } finally {
      setRobotsLoading(false);
    }
  };

  const fetchSerres = async () => {
    setSerresLoading(true);
    try {
      const serresData = await serreService.getSerresByCurrentUser();
      if (Array.isArray(serresData)) {
        setSerres(serresData);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des serres:', error);
      toast.error('Erreur lors de la récupération des serres');
    } finally {
      setSerresLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'missionType') {
      setMissionType(value);
      // Clear irrelevant fields based on mission type
      if (value === 'date') {
        setFormData(prev => ({
          ...prev,
          rep_jr: 0,
          rep_sem: 0,
          jour: null,
          heure: null,
          minute: null
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          date_debut: '',
          date_fin: '',
          date_heure: null,
          date_minute: null
        }));
      }
    } else {
      // Handle special cases for time fields
      let processedValue = value;
      if (field === 'jour' || field === 'heure' || field === 'minute') {
        processedValue = value === 0 ? null : value;
      }
      setFormData(prev => ({ ...prev, [field]: processedValue }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let missionData: any = {
        id_robot: formData.id_robot,
        id_serre: formData.id_serre,
        executed: formData.executed
      };

      if (missionType === 'date') {
        // Date-based mission - combine date and time
        if (formData.date_debut && formData.date_heure !== null && formData.date_minute !== null) {
          const combinedDateTime = new Date(formData.date_debut);
          combinedDateTime.setHours(formData.date_heure, formData.date_minute, 0, 0);
          missionData.date_debut = combinedDateTime.toISOString();
        } else {
          missionData.date_debut = formData.date_debut || null;
        }
        missionData.date_fin = formData.date_fin || null;
        missionData.rep_jr = 0;
        missionData.rep_sem = 0;
        missionData.jour = null;
        missionData.heure = null;
        missionData.minute = null;
      } else {
        // Repetition-based mission
        missionData.date_debut = null;
        missionData.date_fin = null;
        missionData.rep_jr = formData.rep_jr;
        missionData.rep_sem = formData.rep_sem;
        missionData.jour = formData.jour === 0 ? null : formData.jour;
        missionData.heure = formData.heure === 0 ? null : formData.heure;
        missionData.minute = formData.minute === 0 ? null : formData.minute;
      }

      await missionService.updateMission(mission.id, missionData);
      toast.success('Mission mise à jour avec succès');
      onMissionUpdated();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitDisabled = () => {
    if (missionType === 'date') {
      return !formData.id_robot || !formData.id_serre || !formData.date_debut ||
             formData.date_heure === null || formData.date_minute === null;
    } else {
      return !formData.id_robot || !formData.id_serre ||
             !formData.rep_jr && !formData.rep_sem ||
             (formData.rep_sem && (formData.jour === 0 || formData.heure === 0 || formData.minute === 0)) ||
             (formData.rep_jr && (formData.heure === 0 || formData.minute === 0));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modifier la Mission #{mission.id}</CardTitle>
          <CardDescription>
            Modifiez les paramètres de la mission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mission Type Selection */}
            <div className="space-y-3">
              <Label>Type de Mission</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="missionType"
                    value="date"
                    checked={missionType === 'date'}
                    onChange={(e) => handleInputChange('missionType', e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Mission à Date Spécifique</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="missionType"
                    value="repetition"
                    checked={missionType === 'repetition'}
                    onChange={(e) => handleInputChange('missionType', e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Mission Répétitive</span>
                </label>
              </div>
            </div>

            {/* Robot Selection */}
            <div className="space-y-2">
              <Label htmlFor="robot">Robot</Label>
              <Select
                value={formData.id_robot.toString()}
                onValueChange={(value) => handleInputChange('id_robot', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un robot" />
                </SelectTrigger>
                                 <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                   {robotsLoading ? (
                     <SelectItem value="loading" disabled>Chargement...</SelectItem>
                   ) : robots.length > 0 ? (
                     robots.map((robot) => (
                       <SelectItem key={robot.id} value={robot.id.toString()}>
                         {robot.nom} ({robot.referance})
                       </SelectItem>
                     ))
                   ) : (
                     <SelectItem value="none" disabled>Aucun robot disponible</SelectItem>
                   )}
                 </SelectContent>
              </Select>
            </div>

            {/* Serre Selection */}
            <div className="space-y-2">
              <Label htmlFor="serre">Serre</Label>
              <Select
                value={formData.id_serre.toString()}
                onValueChange={(value) => handleInputChange('id_serre', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une serre" />
                </SelectTrigger>
                                 <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                   {serresLoading ? (
                     <SelectItem value="loading" disabled>Chargement...</SelectItem>
                   ) : serres.length > 0 ? (
                     serres.map((serre) => (
                       <SelectItem key={serre.id} value={serre.id.toString()}>
                         {serre.nom}
                       </SelectItem>
                     ))
                   ) : (
                     <SelectItem value="none" disabled>Aucune serre disponible</SelectItem>
                   )}
                 </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields Based on Mission Type */}
            {missionType === 'date' ? (
              /* Date Settings */
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Paramètres de Date</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_debut">Date de début</Label>
                    <Input
                      id="date_debut"
                      type="date"
                      value={formData.date_debut}
                      onChange={(e) => handleInputChange('date_debut', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_fin">Date de fin (optionnel)</Label>
                    <Input
                      id="date_fin"
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => handleInputChange('date_fin', e.target.value)}
                      min={formData.date_debut}
                    />
                  </div>
                </div>

                {/* Time Selection for Date-based Missions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            ) : (
              /* Repetition Settings */
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Paramètres de Répétition</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rep_jr">Répétition journalière</Label>
                    <Select
                      value={formData.rep_jr.toString()}
                      onValueChange={(value) => handleInputChange('rep_jr', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="0">Pas de répétition</SelectItem>
                        <SelectItem value="1">Tous les jours</SelectItem>
                        <SelectItem value="2">Tous les 2 jours</SelectItem>
                        <SelectItem value="3">Tous les 3 jours</SelectItem>
                        <SelectItem value="7">Toutes les semaines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rep_sem">Répétition hebdomadaire</Label>
                    <Select
                      value={formData.rep_sem.toString()}
                      onValueChange={(value) => handleInputChange('rep_sem', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="0">Pas de répétition</SelectItem>
                        <SelectItem value="1">Toutes les semaines</SelectItem>
                        <SelectItem value="2">Toutes les 2 semaines</SelectItem>
                        <SelectItem value="3">Toutes les 3 semaines</SelectItem>
                        <SelectItem value="4">Toutes les 4 semaines</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Time Settings for Repetition */}
                {(formData.rep_jr > 0 || formData.rep_sem > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formData.rep_sem > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="jour">Jour de la semaine</Label>
                        <Select
                          value={formData.jour?.toString() || "0"}
                          onValueChange={(value) => handleInputChange('jour', parseInt(value) || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="0">Sélectionner</SelectItem>
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
                    )}
                    
                                         <div className="space-y-2">
                       <Label htmlFor="heure">Heure</Label>
                       <Select
                         value={formData.heure?.toString() || "0"}
                         onValueChange={(value) => handleInputChange('heure', parseInt(value) || null)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Sélectionner" />
                         </SelectTrigger>
                         <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                           <SelectItem value="0">Sélectionner</SelectItem>
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
                         value={formData.minute?.toString() || "0"}
                         onValueChange={(value) => handleInputChange('minute', parseInt(value) || null)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Sélectionner" />
                         </SelectTrigger>
                         <SelectContent className="z-[9999] bg-white border border-gray-200 shadow-lg">
                           <SelectItem value="0">Sélectionner</SelectItem>
                           {Array.from({ length: 60 }, (_, i) => (
                             <SelectItem key={i} value={i.toString()}>
                               {i.toString().padStart(2, '0')}m
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                  </div>
                )}
              </div>
            )}

            {/* Execution Status */}
            <div className="space-y-2">
              <Label htmlFor="executed">Statut d'exécution</Label>
              <Select
                value={formData.executed.toString()}
                onValueChange={(value) => handleInputChange('executed', value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">En attente</SelectItem>
                  <SelectItem value="true">Exécutée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled() || submitting}
              >
                {submitting ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
