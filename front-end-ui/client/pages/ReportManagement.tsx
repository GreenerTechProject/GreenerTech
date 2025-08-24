import React, { useState, useEffect } from "react";
import DirectorSidebar from "../components/DirectorSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  FolderPlus,
  Folder,
  Calendar,
  User,
  Filter,
  Save,
  FileDown,
  Printer,
  Share
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: string;
  title: string;
  content: string;
  type: "intervention" | "inspection" | "maintenance" | "incident" | "monthly" | "annual";
  status: "draft" | "completed" | "published" | "archived";
  folderId: string;
  createdBy: string;
  createdDate: string;
  lastModified: string;
  tags?: string[];
  attachments?: string[];
  metadata?: {
    location?: string;
    technician?: string;
    interventionId?: string;
  };
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdDate: string;
  reportCount: number;
}

// Simple WYSIWYG Editor Component
const WYSIWYGEditor = ({ content, onChange }: { content: string; onChange: (content: string) => void }) => {
  const [editorContent, setEditorContent] = useState(content);

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setEditorContent(newContent);
    onChange(newContent);
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = document.getElementById("wysiwyg-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end);
    const newContent = 
      editorContent.substring(0, start) + 
      before + selectedText + after + 
      editorContent.substring(end);
    
    setEditorContent(newContent);
    onChange(newContent);
  };

  return (
    <div className="border rounded-lg">
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText("**", "**")}
          title="Gras"
        >
          <strong>B</strong>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText("*", "*")}
          title="Italique"
        >
          <em>I</em>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText("# ", "")}
          title="Titre 1"
        >
          H1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText("## ", "")}
          title="Titre 2"
        >
          H2
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText("- ", "")}
          title="Liste"
        >
          Liste
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText("`", "`")}
          title="Code"
        >
          Code
        </Button>
      </div>
      
      {/* Editor */}
      <Textarea
        id="wysiwyg-editor"
        value={editorContent}
        onChange={handleContentChange}
        placeholder="Commencez à écrire votre rapport..."
        className="border-0 resize-none rounded-t-none"
        rows={20}
      />
    </div>
  );
};

// PDF Viewer Component (simplified)
const PDFViewer = ({ reportContent, title }: { reportContent: string; title: string }) => {
  const formatContentForPDF = (content: string) => {
    // Simple markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="bg-white p-8 shadow-lg border rounded-lg max-h-96 overflow-y-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: formatContentForPDF(reportContent) }}
      />
    </div>
  );
};

export default function ReportManagement() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [activeTab, setActiveTab] = useState("reports");
  
  const [reportForm, setReportForm] = useState({
    title: "",
    content: "",
    type: "intervention" as "intervention" | "inspection" | "maintenance" | "incident" | "monthly" | "annual",
    folderId: "",
    tags: "",
    location: "",
    technician: "",
    interventionId: ""
  });

  const [folderForm, setFolderForm] = useState({
    name: "",
    description: "",
    parentId: ""
  });

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockFolders: Folder[] = [
      {
        id: "1",
        name: "Rapports d'intervention",
        description: "Rapports détaillés des interventions techniques",
        createdDate: "2024-01-01",
        reportCount: 15
      },
      {
        id: "2",
        name: "Inspections mensuelles",
        description: "Rapports d'inspection régulière des installations",
        createdDate: "2024-01-01",
        reportCount: 8
      },
      {
        id: "3",
        name: "Maintenance préventive",
        description: "Documentation des opérations de maintenance",
        createdDate: "2024-01-01",
        reportCount: 12
      },
      {
        id: "4",
        name: "Rapports annuels",
        description: "Synthèses et billons annuels",
        createdDate: "2024-01-01",
        reportCount: 3
      }
    ];

    const mockReports: Report[] = [
      {
        id: "1",
        title: "Rapport d'intervention - Serre A12",
        content: "# Rapport d'intervention - Maintenance système d'irrigation\n\n## Contexte\nIntervention programmée pour la maintenance du système d'irrigation de la serre A12.\n\n## Actions réalisées\n- Vérification des buses d'irrigation\n- Nettoyage des filtres\n- Test de pression\n- Remplacement de 3 buses défectueuses\n\n## Observations\nSystème fonctionnel après intervention. **Recommandation** : programmer une maintenance dans 3 mois.\n\n## Matériel utilisé\n- 3 buses d'irrigation (réf. BUS-001)\n- Joints d'étanchéité\n- Produit nettoyant spécialisé",
        type: "intervention",
        status: "completed",
        folderId: "1",
        createdBy: "Marie Dubois",
        createdDate: "2024-01-24",
        lastModified: "2024-01-24",
        tags: ["irrigation", "maintenance", "serre-a12"],
        metadata: {
          location: "Serre A12, Zone Nord",
          technician: "Marie Dubois",
          interventionId: "INT-2024-001"
        }
      },
      {
        id: "2",
        title: "Inspection mensuelle - Zone Est",
        content: "# Inspection mensuelle - Zone Est\n\n## Périmètre\nInspection de routine des serres B01 à B20 de la zone Est.\n\n## État général\n- **Serres B01-B10** : État satisfaisant\n- **Serres B11-B15** : Quelques anomalies mineures détectées\n- **Serres B16-B20** : État excellent\n\n## Anomalies détectées\n1. **Serre B12** : Ventilation bruyante\n2. **Serre B14** : Température légèrement élevée\n3. **Serre B15** : Fuite mineure dans le système d'irrigation\n\n## Actions recommandées\n- Programmer maintenance ventilation B12\n- Vérifier régulation température B14\n- Réparer fuite B15 (urgent)",
        type: "inspection",
        status: "published",
        folderId: "2",
        createdBy: "Jean Martin",
        createdDate: "2024-01-22",
        lastModified: "2024-01-23",
        tags: ["inspection", "zone-est", "mensuel"],
        metadata: {
          location: "Zone Est - Serres B01 à B20"
        }
      },
      {
        id: "3",
        title: "Maintenance préventive - Système électrique",
        content: "# Maintenance préventive - Système électrique\n\n## Objectif\nMaintenance préventive trimestrielle du système électrique principal.\n\n## Contrôles effectués\n- Vérification des tableaux électriques\n- Test des disjoncteurs\n- Contrôle de l'isolement\n- Vérification des connexions\n\n## Résultats\nTous les tests sont **conformes** aux normes de sécurité.\n\n## Actions préventives\n- Resserrage de 5 connexions\n- Nettoyage des tableaux\n- Mise à jour de la documentation technique",
        type: "maintenance",
        status: "draft",
        folderId: "3",
        createdBy: "Sophie Lambert",
        createdDate: "2024-01-20",
        lastModified: "2024-01-21",
        tags: ["électrique", "préventif", "sécurité"]
      }
    ];

    setFolders(mockFolders);
    setReports(mockReports);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || report.type === selectedType;
    const matchesStatus = selectedStatus === "all" || report.status === selectedStatus;
    const matchesFolder = selectedFolder === "all" || report.folderId === selectedFolder;
    
    return matchesSearch && matchesType && matchesStatus && matchesFolder;
  });

  const handleCreateReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      ...reportForm,
      status: "draft",
      createdBy: "Directeur", // Would be from auth context
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      tags: reportForm.tags ? reportForm.tags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        location: reportForm.location || undefined,
        technician: reportForm.technician || undefined,
        interventionId: reportForm.interventionId || undefined
      }
    };

    setReports([...reports, newReport]);
    setIsCreateReportModalOpen(false);
    resetReportForm();
    
    toast({
      title: "Rapport créé",
      description: `${newReport.title} a été créé avec succès.`,
    });
  };

  const handleCreateFolder = () => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      ...folderForm,
      createdDate: new Date().toISOString().split('T')[0],
      reportCount: 0
    };

    setFolders([...folders, newFolder]);
    setIsCreateFolderModalOpen(false);
    setFolderForm({ name: "", description: "", parentId: "" });
    
    toast({
      title: "Dossier créé",
      description: `${newFolder.name} a été créé avec succès.`,
    });
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setReportForm({
      title: report.title,
      content: report.content,
      type: report.type,
      folderId: report.folderId,
      tags: report.tags?.join(', ') || "",
      location: report.metadata?.location || "",
      technician: report.metadata?.technician || "",
      interventionId: report.metadata?.interventionId || ""
    });
  };

  const handleUpdateReport = () => {
    if (!editingReport) return;

    const updatedReports = reports.map(report =>
      report.id === editingReport.id
        ? { 
            ...report, 
            ...reportForm,
            lastModified: new Date().toISOString().split('T')[0],
            tags: reportForm.tags ? reportForm.tags.split(',').map(tag => tag.trim()) : [],
            metadata: {
              location: reportForm.location || undefined,
              technician: reportForm.technician || undefined,
              interventionId: reportForm.interventionId || undefined
            }
          }
        : report
    );

    setReports(updatedReports);
    setEditingReport(null);
    resetReportForm();
    
    toast({
      title: "Rapport mis à jour",
      description: `Les modifications ont été sauvegardées.`,
    });
  };

  const handleDeleteReport = (id: string) => {
    const reportTitle = reports.find(r => r.id === id)?.title;
    setReports(reports.filter(report => report.id !== id));
    
    toast({
      title: "Rapport supprimé",
      description: `${reportTitle} a été supprimé.`,
      variant: "destructive",
    });
  };

  const handleStatusChange = (reportId: string, newStatus: "draft" | "completed" | "published" | "archived") => {
    const updatedReports = reports.map(report =>
      report.id === reportId ? { ...report, status: newStatus } : report
    );
    setReports(updatedReports);
    
    toast({
      title: "Statut mis à jour",
      description: `Le rapport a été marqué comme ${getStatusDisplayName(newStatus)}.`,
    });
  };

  const resetReportForm = () => {
    setReportForm({
      title: "",
      content: "",
      type: "intervention",
      folderId: "",
      tags: "",
      location: "",
      technician: "",
      interventionId: ""
    });
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "intervention":
        return "Intervention";
      case "inspection":
        return "Inspection";
      case "maintenance":
        return "Maintenance";
      case "incident":
        return "Incident";
      case "monthly":
        return "Mensuel";
      case "annual":
        return "Annuel";
      default:
        return type;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "draft":
        return "Brouillon";
      case "completed":
        return "Terminé";
      case "published":
        return "Publié";
      case "archived":
        return "Archivé";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "published":
        return "bg-green-100 text-green-700 border-green-200";
      case "archived":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "intervention":
        return "bg-blue-50 text-blue-700";
      case "inspection":
        return "bg-green-50 text-green-700";
      case "maintenance":
        return "bg-purple-50 text-purple-700";
      case "incident":
        return "bg-red-50 text-red-700";
      case "monthly":
        return "bg-orange-50 text-orange-700";
      case "annual":
        return "bg-indigo-50 text-indigo-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const exportToPDF = (report: Report) => {
    // In a real implementation, you would use a PDF library like jsPDF or react-pdf
    toast({
      title: "Export PDF",
      description: `${report.title} sera exporté en PDF.`,
    });
  };

  const draftCount = reports.filter(r => r.status === "draft").length;
  const completedCount = reports.filter(r => r.status === "completed").length;
  const publishedCount = reports.filter(r => r.status === "published").length;

  return (
    <div className="flex h-screen bg-gray-50">
      <DirectorSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Gestion des rapports
              </h1>
              <p className="text-gray-600 mt-1">
                Créez, organisez et consultez vos rapports
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Dialog open={isCreateFolderModalOpen} onOpenChange={setIsCreateFolderModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Nouveau dossier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau dossier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name">Nom du dossier</Label>
                      <Input
                        id="folder-name"
                        value={folderForm.name}
                        onChange={(e) => setFolderForm({...folderForm, name: e.target.value})}
                        placeholder="Ex: Rapports d'intervention"
                      />
                    </div>
                    <div>
                      <Label htmlFor="folder-description">Description</Label>
                      <Textarea
                        id="folder-description"
                        value={folderForm.description}
                        onChange={(e) => setFolderForm({...folderForm, description: e.target.value})}
                        placeholder="Description du dossier"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateFolderModalOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateFolder}>
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateReportModalOpen} onOpenChange={setIsCreateReportModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau rapport
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau rapport</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="report-title">Titre du rapport</Label>
                        <Input
                          id="report-title"
                          value={reportForm.title}
                          onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                          placeholder="Ex: Rapport d'intervention - Serre A12"
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-type">Type de rapport</Label>
                        <Select value={reportForm.type} onValueChange={(value: any) => setReportForm({...reportForm, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="intervention">Intervention</SelectItem>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="incident">Incident</SelectItem>
                            <SelectItem value="monthly">Mensuel</SelectItem>
                            <SelectItem value="annual">Annuel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="report-folder">Dossier</Label>
                        <Select value={reportForm.folderId} onValueChange={(value) => setReportForm({...reportForm, folderId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un dossier" />
                          </SelectTrigger>
                          <SelectContent>
                            {folders.map((folder) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="report-tags">Tags (séparés par virgules)</Label>
                        <Input
                          id="report-tags"
                          value={reportForm.tags}
                          onChange={(e) => setReportForm({...reportForm, tags: e.target.value})}
                          placeholder="irrigation, maintenance, urgent"
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-location">Localisation</Label>
                        <Input
                          id="report-location"
                          value={reportForm.location}
                          onChange={(e) => setReportForm({...reportForm, location: e.target.value})}
                          placeholder="Ex: Serre A12, Zone Nord"
                        />
                      </div>
                      <div>
                        <Label htmlFor="report-technician">Technicien</Label>
                        <Input
                          id="report-technician"
                          value={reportForm.technician}
                          onChange={(e) => setReportForm({...reportForm, technician: e.target.value})}
                          placeholder="Nom du technicien"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="report-content">Contenu du rapport</Label>
                      <WYSIWYGEditor
                        content={reportForm.content}
                        onChange={(content) => setReportForm({...reportForm, content})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {setIsCreateReportModalOpen(false); resetReportForm();}}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateReport}>
                      Créer le rapport
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total rapports</p>
                    <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Brouillons</p>
                    <p className="text-3xl font-bold text-gray-600">{draftCount}</p>
                  </div>
                  <Edit className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Terminés</p>
                    <p className="text-3xl font-bold text-blue-600">{completedCount}</p>
                  </div>
                  <FileDown className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Publiés</p>
                    <p className="text-3xl font-bold text-green-600">{publishedCount}</p>
                  </div>
                  <Share className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">Rapports ({reports.length})</TabsTrigger>
              <TabsTrigger value="folders">Dossiers ({folders.length})</TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Rechercher rapports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Dossier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les dossiers</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="intervention">Intervention</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                        <SelectItem value="annual">Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Reports List */}
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </h3>
                            <Badge variant="outline" className={getTypeColor(report.type)}>
                              {getTypeDisplayName(report.type)}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(report.status)}>
                              {getStatusDisplayName(report.status)}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {report.content.substring(0, 150)}...
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {report.createdBy}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(report.createdDate).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex items-center">
                              <Folder className="h-4 w-4 mr-1" />
                              {folders.find(f => f.id === report.folderId)?.name || "Aucun dossier"}
                            </div>
                            {report.metadata?.location && (
                              <div className="flex items-center">
                                <Search className="h-4 w-4 mr-1" />
                                {report.metadata.location}
                              </div>
                            )}
                          </div>

                          {report.tags && report.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {report.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingReport(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportToPDF(report)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>

                          <Dialog open={editingReport?.id === report.id} onOpenChange={(open) => !open && setEditingReport(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReport(report)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Modifier le rapport</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-title">Titre</Label>
                                    <Input
                                      id="edit-title"
                                      value={reportForm.title}
                                      onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-type">Type</Label>
                                    <Select value={reportForm.type} onValueChange={(value: any) => setReportForm({...reportForm, type: value})}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="intervention">Intervention</SelectItem>
                                        <SelectItem value="inspection">Inspection</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="incident">Incident</SelectItem>
                                        <SelectItem value="monthly">Mensuel</SelectItem>
                                        <SelectItem value="annual">Annuel</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-folder">Dossier</Label>
                                    <Select value={reportForm.folderId} onValueChange={(value) => setReportForm({...reportForm, folderId: value})}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {folders.map((folder) => (
                                          <SelectItem key={folder.id} value={folder.id}>
                                            {folder.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-tags">Tags</Label>
                                    <Input
                                      id="edit-tags"
                                      value={reportForm.tags}
                                      onChange={(e) => setReportForm({...reportForm, tags: e.target.value})}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label>Contenu du rapport</Label>
                                  <WYSIWYGEditor
                                    content={reportForm.content}
                                    onChange={(content) => setReportForm({...reportForm, content})}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingReport(null)}>
                                  Annuler
                                </Button>
                                <Button onClick={handleUpdateReport}>
                                  Sauvegarder
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer le rapport</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer ce rapport ? 
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredReports.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun rapport trouvé
                      </h3>
                      <p className="text-gray-600">
                        Aucun rapport ne correspond à vos critères de recherche.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Folders Tab */}
            <TabsContent value="folders" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {folders.map((folder) => (
                  <Card key={folder.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Folder className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{folder.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {folder.reportCount} rapport(s) • Créé le {new Date(folder.createdDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Report Viewer Modal */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Aperçu du rapport</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingReport && exportToPDF(viewingReport)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exporter PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimer
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <ScrollArea className="max-h-[70vh]">
              <PDFViewer reportContent={viewingReport.content} title={viewingReport.title} />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
