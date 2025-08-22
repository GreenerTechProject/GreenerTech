import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Search, FileText, Calendar, MapPin, Building, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorHeader from '@/components/DirectorHeader';
import DirectorSidebar from '@/components/DirectorSidebar';

interface Report {
  id: string;
  title: string;
  date: string;
  serre: string;
  domaine: string;
  bilan?: string;
  type: string;
  hasPDF: boolean;
}

const DirectorReportManagement: React.FC = () => {
  const { user } = useAuth();
  const { isOpen, setIsOpen } = useSidebar();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Rapport de surveillance des maladies - Serre',
        date: '20/08/2025',
        serre: 'Serre B1',
        domaine: 'Domaine Sud',
        bilan: 'Bilan B1-2025-01',
        type: 'surveillance',
        hasPDF: true
      },
      {
        id: '2',
        title: 'Rapport d\'irrigation - Serre A1',
        date: '18/08/2025',
        serre: 'Serre A1',
        domaine: 'Domaine Nord',
        type: 'irrigation',
        hasPDF: false
      },
      // Add more mock reports as needed
    ];
    
    setReports(mockReports);
    setFilteredReports(mockReports);
    setLoading(false);
  }, []);

  useEffect(() => {
    const filtered = reports.filter(report =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.serre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.domaine.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [searchTerm, reports]);

  const stats = {
    totalReports: reports.length,
    coveredSerres: reports.filter(r => r.serre).length,
    domains: [...new Set(reports.map(r => r.domaine))].length,
    withPDF: reports.filter(r => r.hasPDF).length,
    last30Days: reports.filter(r => {
      const reportDate = new Date(r.date.split('/').reverse().join('-'));
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reportDate >= thirtyDaysAgo;
    }).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 hidden sm:block">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Gestion des Rapports
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Gérez et consultez tous les rapports de votre entreprise
          </p>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                  {stats.totalReports}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Rapports
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                  {stats.coveredSerres}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Serres couvertes
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  {stats.domains}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Domaines
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                  {stats.withPDF}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Avec PDF
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                  {stats.last30Days}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  Sur 30 jours
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              type="text"
              placeholder="Rechercher par description, serre, domaine"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Tous
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Avec PDF
            </Button>
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              30 jours
            </Button>
          </div>
        </div>

        {/* Reports Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
              Rapports de l'entreprise ({filteredReports.length})
            </h2>
            <Button className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm">
              Nouveau Rapport
            </Button>
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <Card key={report.id} className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {/* Title and Type */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {report.hasPDF && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            PDF
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <span>{report.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <span>{report.serre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <span>{report.domaine}</span>
                      </div>
                      {report.bilan && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                          <span>{report.bilan}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="text-xs h-8">
                        Voir
                      </Button>
                      {report.hasPDF && (
                        <Button variant="outline" size="sm" className="text-xs h-8">
                          Télécharger
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun rapport trouvé
                </h3>
                <p className="text-gray-600 text-sm">
                  {searchTerm ? 'Aucun rapport ne correspond à votre recherche.' : 'Commencez par créer votre premier rapport.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorReportManagement;
