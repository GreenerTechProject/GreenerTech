import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Building2, Save, Loader2 } from 'lucide-react';
import { companyService, UpdateCompanyRequest } from '../services/companyService';
import { useSidebar } from '../hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import DirectorHeader from '../components/DirectorHeader';

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
  const { isOpen, setIsOpen } = useSidebar();
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
      const companies = await companyService.getCompaniesByDirector(); // Get current user's companies
      
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
      const companyData: UpdateCompanyRequest = {
        nom: formData.nom,
        status_juridique: formData.status_juridique,
        adresse: formData.adresse,
        cie: formData.cie,
        email: formData.email,
        id_fiscale: formData.id_fiscale
      };

      // Use the updateCompany method from the service
      const response = await companyService.updateCompany(company!.id, companyData);
      
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
      <div className="min-h-screen bg-gray-50 flex">
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des informations de l'entreprise...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        <div className="flex-1">
          <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />
          <main className="p-4 sm:p-6 lg:p-8">
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
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 transition-all duration-300">
        <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />

        {/* Company Update Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">


          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'Entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Nom de l'entreprise */}
                    <div className="sm:col-span-2">
                      <Label htmlFor="nom">Nom de l'entreprise *</Label>
                      <Input
                        id="nom"
                        value={formData.nom}
                        onChange={(e) => handleInputChange('nom', e.target.value)}
                        placeholder="Nom de votre entreprise"
                        required
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
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
                        className="mt-1"
                      />
                    </div>

                    {/* Adresse */}
                    <div className="sm:col-span-2">
                      <Label htmlFor="adresse">Adresse</Label>
                      <Textarea
                        id="adresse"
                        value={formData.adresse}
                        onChange={(e) => handleInputChange('adresse', e.target.value)}
                        placeholder="Adresse complète de l'entreprise"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fetchCompany()}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-500">Adresse:</span>
                    <span className="ml-2">{company.adresse || 'Non définie'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompanyUpdate;
