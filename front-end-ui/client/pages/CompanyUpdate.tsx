import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Building2, Save, Loader2 } from 'lucide-react';
import { companyService, CompanyInfo } from '../services/companyService';

interface Company {
  id: number;
  nom: string;
  status_juridique: string;
  adresse: string;
  cie: string;
  id_fiscale: string;
  email: string;
}

const CompanyUpdate: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    status_juridique: '',
    adresse: '',
    cie: '',
    id_fiscale: '',
    email: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const companies = await companyService.getEnterprisesByDirector(0); // 0 is a placeholder, the service will get current user's companies
      
      if (companies && companies.length > 0) {
        const companyData = companies[0]; // Get first company
        setCompany({
          id: parseInt(companyData.id || '0'),
          nom: companyData.nom || '',
          status_juridique: companyData.status_juridique || '',
          adresse: companyData.adresse || '',
          cie: companyData.cie || '',
          id_fiscale: companyData.id_fiscale || '',
          email: companyData.email || ''
        });
        setFormData({
          nom: companyData.nom || '',
          status_juridique: companyData.status_juridique || '',
          adresse: companyData.adresse || '',
          cie: companyData.cie || '',
          id_fiscale: companyData.id_fiscale || '',
          email: companyData.email || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de récupérer les informations de l'entreprise",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'entreprise est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      // Prepare company data for the service
      const companyData: CompanyInfo = {
        nom: formData.nom,
        status_juridique: formData.status_juridique,
        adresse: formData.adresse,
        cie: formData.cie,
        email: formData.email,
        id_fiscale: formData.id_fiscale
      };

      // Use the updateCompany method from the service
      const response = await companyService.updateCompany(companyData);
      
      if (response.success || response.id) {
        toast({
          title: "Succès",
          description: "Informations de l'entreprise mises à jour avec succès"
        });
        // Refresh the company data
        fetchCompany();
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Erreur lors de la mise à jour",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Chargement des informations de l'entreprise...</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune entreprise trouvée
              </h3>
              <p className="text-gray-500">
                Vous devez d'abord créer une entreprise pour pouvoir la modifier.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Building2 className="w-8 h-8 mr-3 text-blue-600" />
          <h1 className="text-3xl font-bold">Modifier l'Entreprise</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations de l'Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom de l'entreprise */}
                <div className="md:col-span-2">
                  <Label htmlFor="nom">Nom de l'entreprise *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                    placeholder="Nom de votre entreprise"
                    required
                  />
                </div>

                {/* Statut juridique */}
                <div>
                  <Label htmlFor="status_juridique">Statut juridique</Label>
                  <Input
                    id="status_juridique"
                    value={formData.status_juridique}
                    onChange={(e) => handleInputChange('status_juridique', e.target.value)}
                    placeholder="SARL, SAS, etc."
                  />
                </div>

                {/* CIE */}
                <div>
                  <Label htmlFor="cie">CIE</Label>
                  <Input
                    id="cie"
                    value={formData.cie}
                    onChange={(e) => handleInputChange('cie', e.target.value)}
                    placeholder="Code CIE"
                  />
                </div>

                {/* ID Fiscale */}
                <div>
                  <Label htmlFor="id_fiscale">Identifiant fiscal</Label>
                  <Input
                    id="id_fiscale"
                    value={formData.id_fiscale}
                    onChange={(e) => handleInputChange('id_fiscale', e.target.value)}
                    placeholder="Numéro fiscal"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email de l'entreprise</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contact@entreprise.com"
                  />
                </div>

                {/* Adresse */}
                <div className="md:col-span-2">
                  <Label htmlFor="adresse">Adresse</Label>
                  <Textarea
                    id="adresse"
                    value={formData.adresse}
                    onChange={(e) => handleInputChange('adresse', e.target.value)}
                    placeholder="Adresse complète de l'entreprise"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fetchCompany()}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Company Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Aperçu de l'Entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Nom:</span>
                <span className="ml-2">{company.nom}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Statut:</span>
                <span className="ml-2">{company.status_juridique || 'Non défini'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">CIE:</span>
                <span className="ml-2">{company.cie || 'Non défini'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">ID Fiscal:</span>
                <span className="ml-2">{company.id_fiscale || 'Non défini'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Email:</span>
                <span className="ml-2">{company.email || 'Non défini'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-500">Adresse:</span>
                <span className="ml-2">{company.adresse || 'Non définie'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyUpdate;
