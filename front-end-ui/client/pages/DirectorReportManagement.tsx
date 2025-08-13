import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '@/hooks/useSidebar';
import DirectorSidebar from '../components/DirectorSidebar';
import DirectorHeader from '@/components/DirectorHeader';
import { useToast } from '@/hooks/use-toast';
import {
  Menu,
  Plus,
  Search,
  Folder,
  File,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  FolderPlus,
  Upload,
  Calendar,
  User,
  Clock,
  Share,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdDate: string;
  createdBy: string;
  reportCount: number;
  color?: string;
}

interface Report {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom' | 'incident';
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  folderId?: string;
  createdDate: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
  tags: string[];
  format: 'html' | 'pdf' | 'markdown';
  size: number; // in KB
  downloadCount: number;
  viewCount: number;
  attachments: {
    id: string;
    name: string;
    size: number;
    url: string;
  }[];
}

const mockFolders: ReportFolder[] = [
  {
    id: '1',
    name: 'Rapports Hebdomadaires',
    description: 'Rapports de performance hebdomadaire',
    createdDate: '2024-01-01',
    createdBy: 'Directeur',
    reportCount: 12,
    color: '#3b82f6'
  },
  {
    id: '2',
    name: 'Rapports Mensuels',
    description: 'Analyses mensuelles et bilans',
    createdDate: '2024-01-01',
    createdBy: 'Directeur',
    reportCount: 8,
    color: '#10b981'
  },
  {
    id: '3',
    name: 'Incidents & Interventions',
    description: 'Rapports d\'incidents et interventions d\'urgence',
    createdDate: '2024-01-05',
    createdBy: 'Directeur',
    reportCount: 5,
    color: '#f59e0b'
  },
  {
    id: '4',
    name: 'Analyses Techniques',
    description: 'Rapports techniques et diagnostics',
    createdDate: '2024-01-10',
    createdBy: 'Jean Dupont',
    reportCount: 15,
    color: '#8b5cf6'
  }
];

const mockReports: Report[] = [
  {
    id: '1',
    title: 'Rapport Hebdomadaire - Semaine 3',
    description: 'Performance des serres et interventions de la semaine',
    content: '<h1>Rapport Hebdomadaire</h1><p>Résumé des activités...</p>',
    type: 'weekly',
    status: 'published',
    folderId: '1',
    createdDate: '2024-01-15',
    createdBy: 'Marie Martin',
    lastModified: '2024-01-16',
    lastModifiedBy: 'Directeur',
    tags: ['performance', 'serres', 'automatisation'],
    format: 'pdf',
    size: 245,
    downloadCount: 8,
    viewCount: 23,
    attachments: [
      { id: '1', name: 'graphiques_performance.xlsx', size: 125, url: '/files/graph1.xlsx' }
    ]
  },
  {
    id: '2',
    title: 'Analyse Mensuelle Janvier 2024',
    description: 'Bilan complet du mois de janvier',
    content: '<h1>Analyse Mensuelle</h1><h2>Objectifs atteints</h2><p>...</p>',
    type: 'monthly',
    status: 'approved',
    folderId: '2',
    createdDate: '2024-01-31',
    createdBy: 'Sophie Dubois',
    lastModified: '2024-02-01',
    lastModifiedBy: 'Sophie Dubois',
    tags: ['mensuel', 'kpi', 'objectifs'],
    format: 'html',
    size: 189,
    downloadCount: 15,
    viewCount: 45,
    attachments: []
  },
  {
    id: '3',
    title: 'Incident Température Critique - Serre A1',
    description: 'Rapport d\'incident sur la panne du système de climatisation',
    content: '<h1>Rapport d\'Incident</h1><h2>Chronologie</h2><p>14h35 - Alerte température...</p>',
    type: 'incident',
    status: 'review',
    folderId: '3',
    createdDate: '2024-01-18',
    createdBy: 'Jean Dupont',
    lastModified: '2024-01-19',
    lastModifiedBy: 'Jean Dupont',
    tags: ['incident', 'température', 'critique', 'serre-a1'],
    format: 'pdf',
    size: 156,
    downloadCount: 3,
    viewCount: 12,
    attachments: [
      { id: '2', name: 'photos_incident.zip', size: 2340, url: '/files/photos.zip' },
      { id: '3', name: 'logs_systeme.txt', size: 45, url: '/files/logs.txt' }
    ]
  }
];

export default function DirectorReportManagement() {
  const { user } = useAuth();
  const { isOpen, setIsOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  
  const [folders, setFolders] = useState<ReportFolder[]>(mockFolders);
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'reports'>('folders');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReportDetailOpen, setIsReportDetailOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    type: 'custom' as Report['type'],
    folderId: '',
    content: '',
    tags: [] as string[]
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesFolder = !selectedFolder || report.folderId === selectedFolder;
    return matchesSearch && matchesType && matchesStatus && matchesFolder;
  });

  const handleCreateFolder = () => {
    const newFolder: ReportFolder = {
      id: Date.now().toString(),
      name: folderForm.name,
      description: folderForm.description,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: user?.name || user?.email || 'Directeur',
      reportCount: 0,
      color: folderForm.color
    };
    
    setFolders([...folders, newFolder]);
    setIsCreateFolderOpen(false);
    setFolderForm({ name: '', description: '', color: '#3b82f6' });
    
    toast({
      title: "Dossier créé",
      description: `Le dossier "${folderForm.name}" a été créé avec succès.`,
    });
  };

  const handleCreateReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      title: reportForm.title,
      description: reportForm.description,
      content: reportForm.content || '<p>Nouveau rapport...</p>',
      type: reportForm.type,
      status: 'draft',
      folderId: reportForm.folderId || undefined,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: user?.name || user?.email || 'Directeur',
      lastModified: new Date().toISOString().split('T')[0],
      lastModifiedBy: user?.name || user?.email || 'Directeur',
      tags: reportForm.tags,
      format: 'html',
      size: Math.floor(Math.random() * 200) + 50,
      downloadCount: 0,
      viewCount: 0,
      attachments: []
    };
    
    setReports([...reports, newReport]);
    
    // Update folder report count
    if (reportForm.folderId) {
      setFolders(folders.map(folder =>
        folder.id === reportForm.folderId
          ? { ...folder, reportCount: folder.reportCount + 1 }
          : folder
      ));
    }
    
    setIsCreateReportOpen(false);
    setReportForm({
      title: '',
      description: '',
      type: 'custom',
      folderId: '',
      content: '',
      tags: []
    });
    
    toast({
      title: "Rapport créé",
      description: `Le rapport "${reportForm.title}" a été créé en brouillon.`,
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    const folderReports = reports.filter(r => r.folderId === folderId);
    if (folderReports.length > 0) {
      toast({
        title: "Impossible de supprimer",
        description: "Le dossier contient des rapports. Veuillez d'abord les déplacer ou les supprimer.",
        variant: "destructive"
      });
      return;
    }
    
    setFolders(folders.filter(f => f.id !== folderId));
    toast({
      title: "Dossier supprimé",
      description: "Le dossier a été supprimé avec succès.",
      variant: "destructive"
    });
  };

  const handleDeleteReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    setReports(reports.filter(r => r.id !== reportId));
    
    // Update folder report count
    if (report?.folderId) {
      setFolders(folders.map(folder =>
        folder.id === report.folderId
          ? { ...folder, reportCount: Math.max(0, folder.reportCount - 1) }
          : folder
      ));
    }
    
    toast({
      title: "Rapport supprimé",
      description: "Le rapport a été supprimé avec succès.",
      variant: "destructive"
    });
  };

  const handleUpdateReportStatus = (reportId: string, newStatus: Report['status']) => {
    setReports(reports.map(report =>
      report.id === reportId
        ? { ...report, status: newStatus, lastModified: new Date().toISOString().split('T')[0] }
        : report
    ));
    
    toast({
      title: "Statut mis à jour",
      description: `Le rapport a été marqué comme ${newStatus}.`,
    });
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setIsReportDetailOpen(true);
    
    // Increment view count
    setReports(reports.map(r =>
      r.id === report.id
        ? { ...r, viewCount: r.viewCount + 1 }
        : r
    ));
  };

  const openEditor = (report?: Report) => {
    if (report) {
      setSelectedReport(report);
      setReportForm({
        title: report.title,
        description: report.description || '',
        type: report.type,
        folderId: report.folderId || '',
        content: report.content,
        tags: report.tags
      });
    }
    setIsEditorOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Brouillon</Badge>;
      case 'review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En révision</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approuvé</Badge>;
      case 'published':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Publié</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Archivé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      annual: 'Annuel',
      custom: 'Personnalisé',
      incident: 'Incident'
    };
    return <Badge variant="secondary">{typeLabels[type as keyof typeof typeLabels] || type}</Badge>;
  };

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const stats = {
    totalReports: reports.length,
    totalFolders: folders.length,
    drafts: reports.filter(r => r.status === 'draft').length,
    published: reports.filter(r => r.status === 'published').length,
    totalSize: reports.reduce((sum, r) => sum + r.size, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="flex-1 transition-all duration-300">
        <DirectorHeader />

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-greener-600">{stats.totalReports}</div>
                <div className="text-sm text-gray-600">Total Rapports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.totalFolders}</div>
                <div className="text-sm text-gray-600">Dossiers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">{stats.drafts}</div>
                <div className="text-sm text-gray-600">Brouillons</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.published}</div>
                <div className="text-sm text-gray-600">Publiés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-gray-600">Taille totale</div>
              </CardContent>
            </Card>
          </div>

          {/* Breadcrumb */}
          {selectedFolder && viewMode === 'reports' && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                Tous les rapports
              </Button>
              <span>/</span>
              <span className="font-medium">
                {folders.find(f => f.id === selectedFolder)?.name}
              </span>
            </div>
          )}

          {viewMode === 'folders' ? (
            /* Folders View */
            <Card>
              <CardHeader>
                <CardTitle>Dossiers de Rapports ({folders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="relative p-4 border-2 rounded-lg cursor-pointer hover:shadow-lg transition-all group"
                      style={{
                        borderColor: folder.color + '40',
                        backgroundColor: folder.color + '10'
                      }}
                      onClick={() => {
                        setSelectedFolder(folder.id);
                        setViewMode('reports');
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: folder.color }}
                          >
                            <Folder className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                            <p className="text-sm text-gray-600">{folder.reportCount} rapport(s)</p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {folder.description && (
                        <p className="text-sm text-gray-600 mb-3">{folder.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Créé par {folder.createdBy} le {new Date(folder.createdDate).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Filters for Reports */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Rechercher par titre, description ou tags..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="quarterly">Trimestriel</SelectItem>
                        <SelectItem value="annual">Annuel</SelectItem>
                        <SelectItem value="custom">Personnalisé</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full lg:w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="review">En révision</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Reports List */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Rapports ({filteredReports.length})
                    {selectedFolder && ` - ${folders.find(f => f.id === selectedFolder)?.name}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{report.title}</div>
                            <div className="text-sm text-gray-600 truncate">
                              {report.description}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-4 mt-1">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {report.createdBy}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(report.createdDate).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(report.lastModified).toLocaleDateString('fr-FR')}
                              </span>
                              <span>{formatFileSize(report.size)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {report.viewCount} vues
                            </div>
                            <div className="text-xs text-gray-500">
                              {report.downloadCount} téléchargements
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1">
                            {getStatusBadge(report.status)}
                            {getTypeBadge(report.type)}
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReportDetail(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditor(report)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share className="h-4 w-4 mr-2" />
                                  Partager
                                </DropdownMenuItem>
                                
                                {report.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, 'review')}>
                                    Soumettre à révision
                                  </DropdownMenuItem>
                                )}
                                
                                {report.status === 'review' && (
                                  <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, 'approved')}>
                                    Approuver
                                  </DropdownMenuItem>
                                )}
                                
                                {report.status === 'approved' && (
                                  <DropdownMenuItem onClick={() => handleUpdateReportStatus(report.id, 'published')}>
                                    Publier
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>

        {/* Create Folder Modal */}
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Dossier</DialogTitle>
              <DialogDescription>
                Organiser vos rapports par dossiers thématiques
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Nom du dossier</Label>
                <Input
                  id="folder-name"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                  placeholder="Ex: Rapports Hebdomadaires"
                />
              </div>
              <div>
                <Label htmlFor="folder-description">Description (optionnel)</Label>
                <Textarea
                  id="folder-description"
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({...folderForm, description: e.target.value})}
                  placeholder="Description du contenu du dossier..."
                />
              </div>
              <div>
                <Label htmlFor="folder-color">Couleur</Label>
                <div className="flex space-x-2 mt-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        folderForm.color === color ? "border-gray-900" : "border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFolderForm({...folderForm, color})}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateFolder} className="bg-greener hover:bg-greener-600">
                  Créer le Dossier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Report Modal */}
        <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Rapport</DialogTitle>
              <DialogDescription>
                Démarrer la création d'un nouveau rapport
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="report-title">Titre du rapport</Label>
                  <Input
                    id="report-title"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                    placeholder="Ex: Rapport Hebdomadaire - Semaine 4"
                  />
                </div>
                
                <div>
                  <Label htmlFor="report-type">Type de rapport</Label>
                  <Select value={reportForm.type} onValueChange={(value: Report['type']) => setReportForm({...reportForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="annual">Annuel</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="report-folder">Dossier (optionnel)</Label>
                  <Select value={reportForm.folderId} onValueChange={(value) => setReportForm({...reportForm, folderId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un dossier..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun dossier</SelectItem>
                      {folders.map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    value={reportForm.description}
                    onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                    placeholder="Description du rapport..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateReport} className="bg-greener hover:bg-greener-600">
                  Créer le Rapport
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Report Detail Modal */}
        <Dialog open={isReportDetailOpen} onOpenChange={setIsReportDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du Rapport</DialogTitle>
              <DialogDescription>
                Informations complètes et contenu du rapport
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Informations Générales</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Titre:</strong> {selectedReport.title}</p>
                      <p><strong>Type:</strong> {getTypeBadge(selectedReport.type)}</p>
                      <p><strong>Statut:</strong> {getStatusBadge(selectedReport.status)}</p>
                      <p><strong>Format:</strong> {selectedReport.format.toUpperCase()}</p>
                      <p><strong>Taille:</strong> {formatFileSize(selectedReport.size)}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Historique</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Créé par:</strong> {selectedReport.createdBy}</p>
                      <p><strong>Date de création:</strong> {new Date(selectedReport.createdDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Dernière modification:</strong> {new Date(selectedReport.lastModified).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Modifié par:</strong> {selectedReport.lastModifiedBy}</p>
                      <p><strong>Vues:</strong> {selectedReport.viewCount}</p>
                      <p><strong>Téléchargements:</strong> {selectedReport.downloadCount}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedReport.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Aperçu du Contenu</h3>
                  <div 
                    className="prose max-w-none bg-gray-50 p-4 rounded-lg border"
                    dangerouslySetInnerHTML={{ __html: selectedReport.content }}
                  />
                </div>

                {/* Attachments */}
                {selectedReport.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Pièces Jointes</h3>
                    <div className="space-y-2">
                      {selectedReport.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <File className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="text-sm font-medium">{attachment.name}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    onClick={() => openEditor(selectedReport)}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Éditer
                  </Button>
                  <Button onClick={() => setIsReportDetailOpen(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Simple WYSIWYG Editor Modal */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Éditeur de Rapport</DialogTitle>
              <DialogDescription>
                Éditeur WYSIWYG pour créer et modifier vos rapports
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editor-title">Titre</Label>
                  <Input
                    id="editor-title"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editor-type">Type</Label>
                  <Select value={reportForm.type} onValueChange={(value: Report['type']) => setReportForm({...reportForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="annual">Annuel</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editor-content">Contenu (HTML)</Label>
                <Textarea
                  id="editor-content"
                  value={reportForm.content}
                  onChange={(e) => setReportForm({...reportForm, content: e.target.value})}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="<h1>Titre du rapport</h1>
<h2>Section 1</h2>
<p>Contenu du rapport...</p>
<ul>
  <li>Point 1</li>
  <li>Point 2</li>
</ul>"
                />
              </div>

              <div>
                <Label>Aperçu</Label>
                <div 
                  className="prose max-w-none bg-gray-50 p-4 rounded-lg border min-h-[200px]"
                  dangerouslySetInnerHTML={{ __html: reportForm.content || '<p>Aucun contenu à afficher</p>' }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => {
                  if (selectedReport) {
                    // Update existing report
                    setReports(reports.map(r =>
                      r.id === selectedReport.id
                        ? {
                            ...r,
                            title: reportForm.title,
                            type: reportForm.type,
                            content: reportForm.content,
                            lastModified: new Date().toISOString().split('T')[0],
                            lastModifiedBy: user?.name || user?.email || 'Directeur'
                          }
                        : r
                    ));
                    toast({
                      title: "Rapport mis à jour",
                      description: "Les modifications ont été sauvegardées.",
                    });
                  }
                  setIsEditorOpen(false);
                  setSelectedReport(null);
                }}
                className="bg-greener hover:bg-greener-600"
              >
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
