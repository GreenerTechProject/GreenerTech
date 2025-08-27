import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Wrench, ClipboardList, Clock, ChevronRight, X, XCircle } from "lucide-react";
import { notificationService, Notification } from "../services/notificationService";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notificationCounts: {
    non_vue: number;
    total: number;
  };
  role: "technicien" | "technicien_sup";
}

export default function NotificationDropdown({ 
  isOpen, 
  onClose, 
  notificationCounts, 
  role 
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchUnreadNotifications();
    }
  }, [isOpen]);

  const fetchUnreadNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = await notificationService.getNotifications();
      const unreadNotifications = allNotifications.filter(n => n.status === 'non_vue');
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await notificationService.markAsSeen(notification.id);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Navigate based on notification type
      if (notification.type_notification.includes('intervention')) {
        if (role === "technicien_sup") {
          // For technician supervisors, navigate to intervention request details
          if (notification.id_intervention) {
            navigate(`/technicien-sup/intervention-request/${notification.id_intervention}?notificationId=${notification.id}`);
          } else {
            navigate("/technicien-sup/interventions");
          }
        } else {
          // For technicians, go to intervention details when validated or rejected
          const isDecision = notification.type_notification === 'intervention_validee' || notification.type_notification === 'intervention_rejetee';
          if (isDecision && notification.id_intervention) {
            navigate(`/technician/interventions/${notification.id_intervention}?notificationId=${notification.id}`);
          } else if (notification.id_intervention) {
            navigate(`/technician/interventions?highlight=${notification.id_intervention}`);
          } else {
            navigate("/technician/missions");
          }
        }
      } else {
        if (role === "technicien_sup") {
          navigate("/technicien-sup/notifications");
        } else {
          navigate("/technician/notifications");
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleSeeAll = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/notifications");
    } else {
      navigate("/technician/notifications");
    }
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'intervention_rejetee') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (type.includes('intervention')) {
      return <Wrench className="h-4 w-4 text-blue-500" />;
    }
    return <ClipboardList className="h-4 w-4 text-gray-500" />;
  };

  const getNotificationTitle = (type: string) => {
    if (type === 'intervention_creee') return "Demande d'intervention";
    if (type === 'intervention_validee') return "Intervention validée";
    if (type === 'intervention_rejetee') return "Intervention rejetée";
    if (type === 'compte_technicien') return "Compte technicien";
    if (type === 'compte_valide') return "Compte validé";
    return "Notification";
  };

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "Date inconnue";

    // Parse the date string - backend now sends UTC+1 timestamps
    let date: Date;
    if (dateString.includes('T')) {
      // ISO format with timezone - parse directly (backend sends UTC+1)
      if (dateString.includes('+01:00') || dateString.includes('+0100')) {
        // Backend is sending UTC+1 - use directly
        date = new Date(dateString);
      } else if (dateString.includes('+') || dateString.includes('Z')) {
        // Other timezone formats - parse normally
        date = new Date(dateString);
      } else {
        // ISO format without timezone - assume it's UTC+1 from backend
        date = new Date(dateString + '+01:00');
      }
    } else {
      // For non-ISO formats, assume local time
      date = new Date(dateString);
    }

    const now = new Date();

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }

    // Calculate time difference in UTC+1 context
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Handle very recent notifications with more precision
    if (diffInSeconds < 30) return "À l'instant";
    if (diffInSeconds < 60) return `Il y a ${diffInSeconds}s`;
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;

    // Handle hours more accurately
    if (diffInHours === 1) return "Il y a 1h";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;

    // Handle days
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;

    // For older notifications, show the actual date
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {notificationCounts.non_vue > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {notificationCounts.non_vue}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Aucune nouvelle notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type_notification)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getNotificationTitle(notification.type_notification)}
                        </p>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(notification.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <button
              onClick={handleSeeAll}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-md transition-colors"
            >
              Voir toutes les notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}
