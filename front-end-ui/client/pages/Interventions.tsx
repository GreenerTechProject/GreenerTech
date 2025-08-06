import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronDown, Edit, Home, Map, Camera } from 'lucide-react';
import { getAllInterventions, Intervention, getStatusDisplay, getInterventionTypeDisplay } from '../services/interventionService';
import TechnicianSidebar from '../components/TechnicianSidebar';

// Mock data for demonstration - will be replaced with real API data
const mockInterventions: Intervention[] = [
  {
    id: 1,
    description: 'Préparation du Sol',
    status: 'terminé',
    date_debut: '2024-01-15',
    date_fin: '2024-01-20',
    total_charges: 150.00,
    id_user: 1,
    id_serre: 1,
    id_type_tache: 1,
    valid: true,
  },
  {
    id: 2,
    description: 'Plantation',
    status: 'encours',
    date_debut: '2024-01-21',
    date_fin: null,
    total_charges: 200.00,
    id_user: 1,
    id_serre: 2,
    id_type_tache: 2,
    valid: false,
  },
  {
    id: 3,
    description: 'Palissage',
    status: 'terminé',
    date_debut: '2024-01-10',
    date_fin: '2024-01-15',
    total_charges: 100.00,
    id_user: 1,
    id_serre: 3,
    id_type_tache: 3,
    valid: true,
  },
  {
    id: 4,
    description: 'Ébourgeonnage',
    status: 'encours',
    date_debut: '2024-01-22',
    date_fin: null,
    total_charges: 75.00,
    id_user: 1,
    id_serre: 4,
    id_type_tache: 4,
    valid: false,
  },
  {
    id: 5,
    description: 'Effeuillage',
    status: 'terminé',
    date_debut: '2024-01-12',
    date_fin: '2024-01-18',
    total_charges: 120.00,
    id_user: 1,
    id_serre: 5,
    id_type_tache: 5,
    valid: true,
  },
  {
    id: 6,
    description: 'Éclaircissage',
    status: 'encours',
    date_debut: '2024-01-25',
    date_fin: null,
    total_charges: 90.00,
    id_user: 1,
    id_serre: 6,
    id_type_tache: 6,
    valid: false,
  },
];

// Mock greenhouse and domain data
const getSerreInfo = (id: number) => {
  const serres = [
    { id: 1, name: 'Serre A1', domaine: 'Domaine Nord', bilan: 'Bilan Q1' },
    { id: 2, name: 'Serre B2', domaine: 'Domaine Sud', bilan: 'Bilan Q2' },
    { id: 3, name: 'Serre C3', domaine: 'Domaine Est', bilan: 'Bilan Q1' },
    { id: 4, name: 'Serre D4', domaine: 'Domaine Ouest', bilan: 'Bilan Q3' },
    { id: 5, name: 'Serre E5', domaine: 'Domaine Central', bilan: 'Bilan Q2' },
    { id: 6, name: 'Serre F6', domaine: 'Domaine Nord', bilan: 'Bilan Q4' },
  ];
  
  return serres.find(s => s.id === id) || { name: 'Serre inconnue', domaine: '', bilan: '' };
};

const getInterventionIcon = (description: string) => {
  const typeDisplay = getInterventionTypeDisplay(description);
  const iconMap: Record<string, JSX.Element> = {
    'Préparation du Sol': (
      <div className="w-8 h-8 rounded-full bg-greener-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 1.625C14 4.73125 11.6867 7.29883 8.68984 7.69531C8.4957 6.23516 7.85313 4.91719 6.9043 3.88633C7.95156 2.01602 9.95312 0.75 12.25 0.75H13.125C13.609 0.75 14 1.14102 14 1.625ZM0 3.375C0 2.89102 0.391016 2.5 0.875 2.5H1.75C5.13242 2.5 7.875 5.24258 7.875 8.625V9.5V13.875C7.875 14.359 7.48398 14.75 7 14.75C6.51602 14.75 6.125 14.359 6.125 13.875V9.5C2.74258 9.5 0 6.75742 0 3.375Z" fill="white"/>
        </svg>
      </div>
    ),
    'Plantation': (
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.63359 0.911328L2.57031 5.38203C2.46367 5.49687 2.40625 5.65 2.40625 5.80586C2.40625 6.15586 2.68789 6.4375 3.03789 6.4375H3.71875L1.71172 8.44453C1.59688 8.55937 1.53125 8.71797 1.53125 8.88203C1.53125 9.22383 1.80742 9.5 2.14922 9.5H3.0625L1.02266 11.9473C0.926953 12.0621 0.875 12.207 0.875 12.3574C0.875 12.7129 1.16211 13 1.51758 13H6.125V13.875C6.125 14.359 6.51602 14.75 7 14.75C7.48398 14.75 7.875 14.359 7.875 13.875V13H12.4824C12.8379 13 13.125 12.7129 13.125 12.3574C13.125 12.207 13.073 12.0621 12.9773 11.9473L10.9375 9.5H11.8508C12.1926 9.5 12.4688 9.22383 12.4688 8.88203C12.4688 8.71797 12.4031 8.55937 12.2883 8.44453L10.2812 6.4375H10.9621C11.3094 6.4375 11.5938 6.15586 11.5938 5.80586C11.5938 5.65 11.5363 5.49687 11.4297 5.38203L7.36641 0.911328C7.27344 0.807422 7.13945 0.75 7 0.75C6.86055 0.75 6.72656 0.807422 6.63359 0.911328Z" fill="white"/>
        </svg>
      </div>
    ),
    'Palissage': (
      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.75 8.625C1.26602 8.625 0.875 9.01602 0.875 9.5C0.875 9.98398 1.26602 10.375 1.75 10.375H12.25C12.734 10.375 13.125 9.98398 13.125 9.5C13.125 9.01602 12.734 8.625 12.25 8.625H1.75ZM1.75 5.125C1.26602 5.125 0.875 5.51602 0.875 6C0.875 6.48398 1.26602 6.875 1.75 6.875H12.25C12.734 6.875 13.125 6.48398 13.125 6C13.125 5.51602 12.734 5.125 12.25 5.125H1.75Z" fill="white"/>
        </svg>
      </div>
    ),
    'Ébourgeonnage': (
      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 6L5.91992 4.91992C6.05391 4.57539 6.125 4.20352 6.125 3.8125C6.125 2.11992 4.75508 0.75 3.0625 0.75C1.36992 0.75 0 2.11992 0 3.8125C0 5.50508 1.36992 6.875 3.0625 6.875C3.45352 6.875 3.82539 6.80117 4.16992 6.66992L5.25 7.75L4.16992 8.83008C3.82539 8.69609 3.45352 8.625 3.0625 8.625C1.36992 8.625 0 9.99492 0 11.6875C0 13.3801 1.36992 14.75 3.0625 14.75C4.75508 14.75 6.125 13.3801 6.125 11.6875C6.125 11.2965 6.05117 10.9246 5.91992 10.5801L13.65 2.85C13.8441 2.65586 13.8441 2.34414 13.65 2.15C12.8762 1.37617 11.6238 1.37617 10.85 2.15L7 6ZM7.61797 10.118L10.85 13.35C11.6238 14.1238 12.8762 14.1238 13.65 13.35C13.8441 13.1559 13.8441 12.8441 13.65 12.65L9.36797 8.36797L7.61797 10.118ZM1.75 3.8125C1.75 3.64014 1.78395 3.46947 1.84991 3.31023C1.91587 3.15099 2.01255 3.0063 2.13442 2.88442C2.2563 2.76255 2.40099 2.66587 2.56023 2.59991C2.71947 2.53395 2.89014 2.5 3.0625 2.5C3.23486 2.5 3.40553 2.53395 3.56477 2.59991C3.72401 2.66587 3.8687 2.76255 3.99058 2.88442C4.11245 3.0063 4.20913 3.15099 4.27509 3.31023C4.34105 3.46947 4.375 3.64014 4.375 3.8125C4.375 3.98486 4.34105 4.15553 4.27509 4.31477C4.20913 4.47401 4.11245 4.6187 3.99058 4.74058C3.8687 4.86245 3.72401 4.95913 3.56477 5.02509C3.40553 5.09105 3.23486 5.125 3.0625 5.125C2.89014 5.125 2.71947 5.09105 2.56023 5.02509C2.40099 4.95913 2.2563 4.86245 2.13442 4.74058C2.01255 4.6187 1.91587 4.47401 1.84991 4.31477C1.78395 4.15553 1.75 3.98486 1.75 3.8125ZM3.0625 10.375C3.23486 10.375 3.40553 10.4089 3.56477 10.4749C3.72401 10.5409 3.8687 10.6375 3.99058 10.7594C4.11245 10.8813 4.20913 11.026 4.27509 11.1852C4.34105 11.3445 4.375 11.5151 4.375 11.6875C4.375 11.8599 4.34105 12.0305 4.27509 12.1898C4.20913 12.349 4.11245 12.4937 3.99058 12.6156C3.8687 12.7375 3.72401 12.8341 3.56477 12.9001C3.40553 12.9661 3.23486 13 3.0625 13C2.89014 13 2.71947 12.9661 2.56023 12.9001C2.40099 12.8341 2.2563 12.7375 2.13442 12.6156C2.01255 12.4937 1.91587 12.349 1.84991 12.1898C1.78395 12.0305 1.75 11.8599 1.75 11.6875C1.75 11.5151 1.78395 11.3445 1.84991 11.1852C1.91587 11.026 2.01255 10.8813 2.13442 10.7594C2.2563 10.6375 2.40099 10.5409 2.56023 10.4749C2.71947 10.4089 2.89014 10.375 3.0625 10.375Z" fill="white"/>
        </svg>
      </div>
    ),
    'Effeuillage': (
      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.4375 3.37511C5.28828 3.37511 3.46992 4.78331 2.85195 6.72471C3.7707 6.25987 4.80703 6.0001 5.90625 6.0001H8.3125C8.55313 6.0001 8.75 6.19698 8.75 6.4376C8.75 6.67823 8.55313 6.8751 8.3125 6.8751H7.875H5.90625C5.45234 6.8751 5.01211 6.92706 4.58828 7.02276C3.88008 7.18409 3.22109 7.4712 2.63594 7.86221C1.04727 8.92042 0 10.7278 0 12.7814V13.2189C0 13.5825 0.292578 13.8751 0.65625 13.8751C1.01992 13.8751 1.3125 13.5825 1.3125 13.2189V12.7814C1.3125 11.4497 1.87852 10.2521 2.78359 9.41261C3.325 11.4771 5.20352 13.0001 7.4375 13.0001H7.46484C11.077 12.981 14 9.42081 14 5.03214C14 3.86729 13.7949 2.75987 13.423 1.76182C13.352 1.57315 13.0758 1.58136 12.9801 1.75909C12.466 2.72159 11.4488 3.37511 10.2812 3.37511H7.4375Z" fill="white"/>
        </svg>
      </div>
    ),
    'Éclaircissage': (
      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 6L5.91992 4.91992C6.05391 4.57539 6.125 4.20352 6.125 3.8125C6.125 2.11992 4.75508 0.75 3.0625 0.75C1.36992 0.75 0 2.11992 0 3.8125C0 5.50508 1.36992 6.875 3.0625 6.875C3.45352 6.875 3.82539 6.80117 4.16992 6.66992L5.25 7.75L4.16992 8.83008C3.82539 8.69609 3.45352 8.625 3.0625 8.625C1.36992 8.625 0 9.99492 0 11.6875C0 13.3801 1.36992 14.75 3.0625 14.75C4.75508 14.75 6.125 13.3801 6.125 11.6875C6.125 11.2965 6.05117 10.9246 5.91992 10.5801L13.65 2.85C13.8441 2.65586 13.8441 2.34414 13.65 2.15C12.8762 1.37617 11.6238 1.37617 10.85 2.15L7 6ZM7.61797 10.118L10.85 13.35C11.6238 14.1238 12.8762 14.1238 13.65 13.35C13.8441 13.1559 13.8441 12.8441 13.65 12.65L9.36797 8.36797L7.61797 10.118ZM1.75 3.8125C1.75 3.64014 1.78395 3.46947 1.84991 3.31023C1.91587 3.15099 2.01255 3.0063 2.13442 2.88442C2.2563 2.76255 2.40099 2.66587 2.56023 2.59991C2.71947 2.53395 2.89014 2.5 3.0625 2.5C3.23486 2.5 3.40553 2.53395 3.56477 2.59991C3.72401 2.66587 3.8687 2.76255 3.99058 2.88442C4.11245 3.0063 4.20913 3.15099 4.27509 3.31023C4.34105 3.46947 4.375 3.64014 4.375 3.8125C4.375 3.98486 4.34105 4.15553 4.27509 4.31477C4.20913 4.47401 4.11245 4.6187 3.99058 4.74058C3.8687 4.86245 3.72401 4.95913 3.56477 5.02509C3.40553 5.09105 3.23486 5.125 3.0625 5.125C2.89014 5.125 2.71947 5.09105 2.56023 5.02509C2.40099 4.95913 2.2563 4.86245 2.13442 4.74058C2.01255 4.6187 1.91587 4.47401 1.84991 4.31477C1.78395 4.15553 1.75 3.98486 1.75 3.8125ZM3.0625 10.375C3.23486 10.375 3.40553 10.4089 3.56477 10.4749C3.72401 10.5409 3.8687 10.6375 3.99058 10.7594C4.11245 10.8813 4.20913 11.026 4.27509 11.1852C4.34105 11.3445 4.375 11.5151 4.375 11.6875C4.375 11.8599 4.34105 12.0305 4.27509 12.1898C4.20913 12.349 4.11245 12.4937 3.99058 12.6156C3.8687 12.7375 3.72401 12.8341 3.56477 12.9001C3.40553 12.9661 3.23486 13 3.0625 13C2.89014 13 2.71947 12.9661 2.56023 12.9001C2.40099 12.8341 2.2563 12.7375 2.13442 12.6156C2.01255 12.4937 1.91587 12.349 1.84991 12.1898C1.78395 12.0305 1.75 11.8599 1.75 11.6875C1.75 11.5151 1.78395 11.3445 1.84991 11.1852C1.91587 11.026 2.01255 10.8813 2.13442 10.7594C2.2563 10.6375 2.40099 10.5409 2.56023 10.4749C2.71947 10.4089 2.89014 10.375 3.0625 10.375Z" fill="white"/>
        </svg>
      </div>
    ),
  };
  
  return iconMap[description] || (
    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
      <span className="text-white text-xs">⚙️</span>
    </div>
  );
};

export default function Interventions() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const itemsPerPage = 7;

  useEffect(() => {
    const fetchInterventions = async () => {
      try {
        setLoading(true);
        // For now, use mock data. Later replace with: const data = await getAllInterventions();
        setInterventions(mockInterventions);
      } catch (error) {
        console.error('Error loading interventions:', error);
        // Fallback to mock data
        setInterventions(mockInterventions);
      } finally {
        setLoading(false);
      }
    };

    fetchInterventions();
  }, []);

  // Filter interventions based on search term
  const filteredInterventions = interventions.filter(intervention =>
    intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSerreInfo(intervention.id_serre).name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInterventions = filteredInterventions.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-greener-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des interventions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logo and navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <TechnicianSidebar userRole={user?.role as "technicien" | "technicien_sup"} />
              
              <img 
                src="https://api.builder.io/api/v1/image/assets/TEMP/e838108a21bc561dc1bf539fbfff0473770f8f68?width=364" 
                alt="Greener Tech Logo" 
                className="h-16 w-auto"
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 text-blue-600">
                <Home className="h-6 w-6" />
                <Map className="h-6 w-6" />
                <Camera className="h-6 w-6" />
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-10 w-80 bg-white border-gray-300"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-6 py-14">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Interventions</h1>
          <p className="text-gray-600">Suivi et gestion des interventions entre superviseurs et techniciens</p>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher une Intervention..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-112 bg-white border-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36 bg-gray-50 border-gray-300">
                <SelectValue placeholder="Trier par" />
                <ChevronDown className="h-4 w-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Statut</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <Button className="bg-greener-500 hover:bg-greener-600 text-white">
              <Edit className="h-4 w-4 mr-2" />
              Demande une intervention
            </Button>
          </div>
        </div>

        {/* Interventions Table */}
        <Card className="border border-gray-200 rounded-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-gray-600 font-medium text-xs tracking-wider uppercase px-6 py-3">
                    Type d'intervention
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs tracking-wider uppercase px-6 py-3">
                    ID Serre
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs tracking-wider uppercase px-6 py-3 text-center">
                    Statut
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium text-xs tracking-wider uppercase px-6 py-3 text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {paginatedInterventions.map((intervention, index) => {
                  const serreInfo = getSerreInfo(intervention.id_serre);
                  const statusDisplay = getStatusDisplay(intervention.status);
                  const isEvenRow = index % 2 === 1;
                  
                  return (
                    <TableRow 
                      key={intervention.id}
                      className={`${isEvenRow ? 'bg-gray-50' : 'bg-white'} border-t border-gray-100`}
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {getInterventionIcon(intervention.description)}
                          <span className="font-medium text-gray-900 text-sm">
                            {intervention.description}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4">
                        <span className="text-gray-900 text-sm">
                          {serreInfo.name} / {serreInfo.domaine} / {serreInfo.bilan}
                        </span>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={`${statusDisplay.color} text-white text-xs font-medium px-3 py-1 rounded-full`}
                          >
                            {statusDisplay.text}
                          </Badge>
                          {intervention.status === 'encours' && (
                            <Badge className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                              En cours
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4 text-center">
                        <Badge 
                          className={`${intervention.valid ? 'bg-green-500' : 'bg-gray-300'} text-white text-xs font-medium px-3 py-1 rounded-full`}
                        >
                          {intervention.valid ? 'Programmé' : 'Demande'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredInterventions.length)} sur {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-gray-600 border-gray-300"
            >
              Précédent
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 border-gray-300 hover:bg-gray-50"
                }
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-gray-600 border-gray-300"
            >
              Suivant
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
