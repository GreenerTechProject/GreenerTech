import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Circle, CheckCircle, Filter, X, AlertTriangle, FileText, MapPin, Calendar, Clock, CheckCircle2, XCircle } from "lucide-react";
import { notificationService, Notification } from "../services/notificationService";
import { cn } from "@/lib/utils";

type FilterType = "all" | "unread" | "read";

export default function TechSupNotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await notificationService.getNotifications();
      setNotifications(allNotifications);
      
      const unreadCount = allNotifications.filter(n => n.status === 'non_vue').length;
      const readCount = allNotifications.filter(n => n.status === 'vue').length;
      
      setStats({
        total: allNotifications.length,
        unread: unreadCount,
        read: readCount
      });
    } catch (error) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;
    
    switch (activeFilter) {
      case "unread":
        filtered = notifications.filter(n => n.status === 'non_vue');
        break;
      case "read":
        filtered = notifications.filter(n => n.status === 'vue');
        break;
      default:
        filtered = notifications;
    }
    
    setFilteredNotifications(filtered);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'non_vue') {
      try {
        await notificationService.markAsSeen(notification.id);
        
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, status: 'vue' as const } : n
        ));
        setStats(prev => ({
          ...prev,
          unread: prev.unread - 1,
          read: prev.read + 1
        }));
      } catch (error) {
        // Error marking notification as seen
      }
    }

    if (notification.type_notification.includes('intervention')) {
      if (notification.id_intervention) {
        navigate(`/technicien-sup/intervention-request/${notification.id_intervention}?notificationId=${notification.id}`);
      } else {
        navigate("/technicien-sup/missions");
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('intervention')) {
      return <Circle className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getNotificationTitle = (notification: Notification) => {
    if (notification.type_notification.includes('intervention')) {
      if (notification.id_intervention) {
        return `Intervention #${notification.id_intervention}`;
      }
      return "Nouvelle intervention";
    }
    return "Notification";
  };

  const getNotificationDescription = (notification: Notification) => {
    return notification.description;
  };

  const getNotificationBadge = (type: string) => {
    if (type === 'intervention_creee') return "En attente";
    if (type === 'intervention_validee') return "Validée";
    if (type === 'compte_technicien') return "Compte";
    if (type === 'compte_valide') return "Validé";
    return "Info";
  };

  const getBadgeColor = (type: string) => {
    if (type === 'intervention_creee') return "bg-yellow-100 text-yellow-800";
    if (type === 'intervention_validee') return "bg-green-100 text-green-800";
    if (type === 'compte_technicien') return "bg-blue-100 text-blue-800";
    if (type === 'compte_valide') return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'intervention': '🔧 Intervention',
      'intervention_creee': '🆕 Intervention créée',
      'intervention_validee': '✅ Intervention validée',
      'success': '✅ Succès',
      'info': 'ℹ️ Information',
      'reminder': '⏰ Rappel',
      'warning': '⚠️ Avertissement',
      'error': '❌ Erreur'
    };
    return typeLabels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          </div>
          <p className="text-gray-600">Gérez toutes vos notifications et demandes d'intervention</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Circle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Non lues</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unread}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lues</p>
                <p className="text-2xl font-bold text-green-600">{stats.read}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtres</span>
            </div>
            <div className="flex gap-2">
              {[
                { key: "all", label: "Toutes", count: stats.total },
                { key: "unread", label: "Non lues", count: stats.unread },
                { key: "read", label: "Lues", count: stats.read }
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={activeFilter === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.key as FilterType)}
                  className="flex items-center gap-2"
                >
                  {filter.label}
                  <Badge variant="secondary" className="ml-1">
                    {filter.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {activeFilter === "all" 
                  ? "Aucune notification trouvée" 
                  : activeFilter === "unread" 
                    ? "Aucune notification non lue" 
                    : "Aucune notification lue"
                }
              </p>
              <p className="text-gray-400 text-sm">
                {activeFilter === "all" 
                  ? "Vous n'avez pas encore reçu de notifications" 
                  : "Toutes les notifications ont été traitées"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-gray-50",
                    notification.status === 'non_vue' 
                      ? "bg-blue-50 border-l-4 border-l-blue-500" 
                      : "bg-white"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type_notification)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {getNotificationTitle(notification)}
                            </h3>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getBadgeColor(notification.type_notification))}
                            >
                              {getNotificationBadge(notification.type_notification)}
                            </Badge>
                            {notification.status === 'non_vue' && (
                              <Badge variant="default" className="bg-blue-600 text-white text-xs">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {getNotificationDescription(notification)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{getNotificationTime(notification.date)}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDate(notification.date)}</span>
                        </div>
                        
                        {notification.status === 'non_vue' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                          >
                            Marquer comme lue
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
