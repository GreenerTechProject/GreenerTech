import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TechnicianSidebar from "./TechnicianSidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Map, ChevronDown, User, LogOut, Sun, Moon, Bell, AlertTriangle, AlertCircle, AlertOctagon, CheckCircle, BarChart3, Clock, Wrench, ClipboardList } from "lucide-react";
import { notificationService, NotificationCounts, Notification } from "../services/notificationService";
import { AlertService } from "../services/alertService";

type UserRole = "technicien" | "technicien_sup";

interface TechHeaderProps {
  role: UserRole;
}

interface AlertCounts {
  total: number;
  high: number;      // status_alert = 2 (very dangerous)
  medium: number;    // status_alert = 1 (medium)
  low: number;       // status_alert = 0 (low)
}

export default function TechHeader({ role }: TechHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    total: 0,
    non_vue: 0,
    vue: 0,
    byType: {
      intervention_creee: 0,
      intervention_validee: 0,
      compte_technicien: 0,
      compte_valide: 0,
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [loading, setLoading] = useState(true);

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch notification counts and alert counts on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotificationCounts();
      fetchNotifications();
      fetchAlertCounts();
      // Set up interval to refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCounts();
        fetchNotifications();
        fetchAlertCounts();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotificationCounts = async () => {
    try {
      const counts = await notificationService.getNotificationCounts();
      setNotificationCounts(counts);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const allNotifications = await notificationService.getNotifications();
      const unreadNotifications = allNotifications.filter(n => n.status === 'non_vue');
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchAlertCounts = async () => {
    try {
      // Get alerts from user's assigned serres
      const alerts = await AlertService.getAlertsByAssignedSerres();
      
      // Count alerts by severity level
      const counts: AlertCounts = {
        total: alerts.length,
        high: alerts.filter(alert => alert.status_alert === 2).length,      // Very dangerous
        medium: alerts.filter(alert => alert.status_alert === 1).length,    // Medium
        low: alerts.filter(alert => alert.status_alert === 0).length        // Low
      };
      
      setAlertCounts(counts);
    } catch (error) {
      console.error('Error fetching alert counts:', error);
      setAlertCounts({ total: 0, high: 0, medium: 0, low: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleProfile = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/profile");
    } else {
      navigate("/technicien/profile");
    }
  };

  const handleAlerts = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/alerts");
    } else {
      navigate("/technician/alerts");
    }
  };

  const handleNotifications = () => {
    if (role === "technicien_sup") {
      navigate("/technicien-sup/notifications");
    } else {
      navigate("/technician/notifications");
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await notificationService.markAsSeen(notification.id);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Update notification counts
      setNotificationCounts(prev => ({
        ...prev,
        non_vue: Math.max(0, prev.non_vue - 1),
        total: Math.max(0, prev.total - 1)
      }));
      
      // Navigate based on notification type
      if (notification.type_notification.includes('intervention')) {
        if (role === "technicien_sup") {
          navigate("/technicien-sup/missions");
        } else {
          navigate("/technician/missions");
        }
      } else {
        if (role === "technicien_sup") {
          navigate("/technicien-sup/notifications");
        } else {
          navigate("/technician/notifications");
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('intervention')) {
      return <Wrench className="h-4 w-4 text-blue-500" />;
    }
    return <ClipboardList className="h-4 w-4 text-gray-500" />;
  };

  const getNotificationTitle = (type: string) => {
    if (type === 'intervention_creee') return "Demande d'intervention";
    if (type === 'intervention_validee') return "Intervention validée";
    if (type === 'compte_technicien') return "Compte technicien";
    if (type === 'compte_valide') return "Compte validé";
    return "Notification";
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "il y a quelques minutes";
    if (diffInHours === 1) return "il y a 1h";
    if (diffInHours < 24) return `il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "il y a 1 jour";
    return `il y a ${diffInDays} jours`;
  };

  return (
    <header className="bg-white border-b sticky top-0 z-[999999]">
      <div className="max-w-full px-3 sm:px-4 lg:px-6">
        {/* Mobile-first responsive grid */}
        <div className="flex items-center justify-between py-2 sm:py-3">
          {/* Left: Hamburger / Navigation */}
          <div className="flex-shrink-0">
            <TechnicianSidebar userRole={role} />
          </div>

          {/* Center: Home and Map icons (centered) */}
          <div className="flex-1 flex items-center justify-center gap-3 px-2">
            <div 
              className="h-9 w-9 rounded-xl bg-[#B4CC5F] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#9BB84F] transition-colors duration-200 active:scale-95 flex-shrink-0"
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup/home" : "/technician/dashboard")}
              title="Accueil"
            >
              <Home className="h-5 w-5 text-white" />
            </div>
            <div 
              className="cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95 flex-shrink-0"
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/map")}
              title="Carte"
            >
              <Map className="h-5 w-5 text-blue-700" />
            </div>
          </div>

          {/* Right: Alerts, Notifications and User dropdown */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Alert Triangle Icon - for REAL alerts from assigned serres */}
            <div className="relative group">
              <div 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm cursor-pointer hover:bg-orange-200 transition-colors duration-200 active:scale-95 border border-orange-200 flex-shrink-0"
                onClick={handleAlerts}
                title="Alertes des serres assignées"
              >
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                {/* Alert Badge - Real alert data */}
                {alertCounts.total > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-xs">{alertCounts.total}</span>
                  </div>
                )}
              </div>
              
              {/* Tooltip below the Alert icon - Real alert data */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="text-center">
                  <div className="font-medium mb-1">Alertes des Serres</div>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex items-center justify-center gap-2">
                      <AlertOctagon className="h-3 w-3 text-red-400" />
                      <span>{alertCounts.high} alerte(s) critique(s)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-3 w-3 text-yellow-400" />
                      <span>{alertCounts.medium} alerte(s) moyenne(s)</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span>{alertCounts.low} alerte(s) faible(s)</span>
                    </div>
                    <div className="border-t border-gray-600 pt-1 mt-1 flex items-center justify-center gap-2">
                      <BarChart3 className="h-3 w-3 text-blue-400" />
                      <span>Total: {alertCounts.total} alerte(s)</span>
                    </div>
                  </div>
                </div>
                {/* Arrow pointing up to the Alert icon */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* Notification Bell Icon - for intervention requests */}
            <div className="relative group" style={{ zIndex: 999999 }}>
              <div 
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm cursor-pointer hover:bg-blue-200 transition-colors duration-200 active:scale-95 border border-blue-200 flex-shrink-0"
                onClick={handleNotifications}
                title="Demandes d'intervention"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                {/* Notification Badge - Real notification data */}
                {notificationCounts.non_vue > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-xs">{notificationCounts.non_vue}</span>
                  </div>
                )}
              </div>
              
              {/* Notification Dropdown - Shows on hover */}
              <div 
                className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto backdrop-blur-sm bg-white/95" 
                style={{ 
                  zIndex: 999999,
                  isolation: 'isolate',
                  position: 'absolute',
                  transform: 'translateZ(0)'
                }}
              >
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
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
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
                                              {notifications.slice(0, 3).map((notification, index) => (
                          <div 
                            key={notification.id} 
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleNotificationClick(notification)}
                          >
                                                      <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type_notification)}
                              </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {getNotificationTitle(notification.type_notification)}
                                </p>
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
                {notificationCounts.non_vue > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                    <button
                      onClick={handleNotifications}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Voir toutes les notifications ({notifications.length > 0 ? notificationCounts.total : 0})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2 sm:px-3 h-8 sm:h-9">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium text-gray-900 leading-none">
                        {user?.name || "Utilisateur"}
                      </div>
                      <div className="text-xs text-gray-500 leading-none truncate max-w-[12rem]">
                        {user?.email}
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium text-gray-900">{user?.name || "Utilisateur"}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" /> Mode clair
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" /> Mode sombre
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}


