import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { robotService } from '../services/robotService';
import { serreService } from '../services/serreService';
import { missionService } from '../services/missionService';
import { toast } from 'sonner';

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
  id_domaine?: number; // Make optional since ExtendedSerre doesn't have it
  surface?: number;
  domaine_nom?: string; // Add this property that ExtendedSerre has
}

interface MissionFormData {
  id_robot: number;
  id_serre: number;
  rep_jr: number;
  rep_sem: number;
  date_debut: Date | null;
  date_fin: Date | null;
}

export const MissionCreation: React.FC<MissionCreationProps> = ({ onMissionCreated }) => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [serres, setSerres] = useState<Serre[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MissionFormData>({
    id_robot: 0,
    id_serre: 0,
    rep_jr: 1,
    rep_sem: 1,
    date_debut: new Date(),
    date_fin: null,
  });

  useEffect(() => {
    fetchRobots();
    fetchSerres();
  }, []);

  const fetchRobots = async () => {
    try {
      const robotsData = await robotService.getAllRobots();
      setRobots(robotsData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des robots:', error);
      toast.error('Erreur lors de la récupération des robots');
    }
  };

  const fetchSerres = async () => {
    try {
      // For technicians, only show serres they have access to
      const serresData = await serreService.getSerresByCurrentUser();
      console.log('Serres disponibles pour l\'utilisateur:', serresData);
      setSerres(serresData);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des serres:', error);
      toast.error('Erreur lors de la récupération des serres');
    }
  };

  const handleInputChange = (field: keyof MissionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_robot || !formData.id_serre || !formData.date_debut) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const missionData = {
        id_robot: formData.id_robot,
        id_serre: formData.id_serre,
        rep_jr: formData.rep_jr,
        rep_sem: formData.rep_sem,
        date_debut: formData.date_debut?.toISOString(),
        date_fin: formData.date_fin?.toISOString() || null,
        executed: false
      };

      await missionService.createMission(missionData);
      toast.success('Mission créée avec succès!');
      
      // Reset form
      setFormData({
        id_robot: 0,
        id_serre: 0,
        rep_jr: 1,
        rep_sem: 1,
        date_debut: new Date(),
        date_fin: null,
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
          Configurez une mission pour un robot dans une serre à laquelle vous avez accès
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Robot Selection */}
          <div className="space-y-2">
            <Label htmlFor="robot">Robot *</Label>
            <Select
              value={formData.id_robot.toString()}
              onValueChange={(value) => handleInputChange('id_robot', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un robot" />
              </SelectTrigger>
              <SelectContent>
                {robots.map((robot) => (
                  <SelectItem key={robot.id} value={robot.id.toString()}>
                    {robot.nom} - {robot.referance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Serre Selection */}
          <div className="space-y-2">
            <Label htmlFor="serre">Serre *</Label>
            <Select
              value={formData.id_serre.toString()}
              onValueChange={(value) => handleInputChange('id_serre', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une serre" />
              </SelectTrigger>
              <SelectContent>
                {serres.map((serre) => (
                  <SelectItem key={serre.id} value={serre.id.toString()}>
                    {serre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Repetition Settings */}
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

          {/* Date Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_debut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_debut ? (
                      format(formData.date_debut, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date_debut || undefined}
                    onSelect={(date) => handleInputChange('date_debut', date)}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin (optionnel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_fin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_fin ? (
                      format(formData.date_fin, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date_fin || undefined}
                    onSelect={(date) => handleInputChange('date_fin', date)}
                    initialFocus
                    locale={fr}
                    disabled={(date) => date < (formData.date_debut || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !formData.id_robot || !formData.id_serre || !formData.date_debut}
          >
            {loading ? 'Création en cours...' : 'Créer la mission'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
