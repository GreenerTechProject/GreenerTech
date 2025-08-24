import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, Map, ChevronDown, User, LogOut, Sun, Moon, Bell, CheckCircle, BarChart3, Clock, Wrench, ClipboardList, Users, Menu, X } from "lucide-react";
import { notificationService, NotificationCounts, Notification } from "../services/notificationService";

type UserRole = "technicien" | "technicien_sup";

interface TechHeaderProps {
  role: UserRole;
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

const TechHeader: React.FC<TechHeaderProps> = ({ role, onMenuClick, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    total: 0,
    non_vue: 0,
    vue: 0,
    byType: {
      intervention_creee: 0,
      intervention_validee: 0,
      intervention_rejetee: 0,
      compte_technicien: 0,
      compte_valide: 0,
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch notification counts on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotificationCounts();
      fetchNotifications();
      // Set up interval to refresh data every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCounts();
        fetchNotifications();
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

  const handleProfile = () => {
    navigate(role === "technicien_sup" ? "/technicien-sup/profile" : "/technician/profile");
  };

  const handleNotifications = () => {
    navigate(role === "technicien_sup" ? "/technicien-sup/notifications" : "/technician/notifications");
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark notification as read
      await notificationService.markAsSeen(notification.id);
      
      // Refresh notifications
      fetchNotifications();
      fetchNotificationCounts();
      
      // Navigate based on notification type
      switch (notification.type_notification) {
        case 'intervention_creee':
          navigate(role === "technicien_sup" ? "/technicien-sup/interventions" : "/technician/interventions");
          break;
        case 'intervention_validee':
          navigate(role === "technicien_sup" ? "/technicien-sup/interventions" : "/technician/interventions");
          break;
        case 'compte_technicien':
          navigate(role === "technicien_sup" ? "/technicien-sup/technicians" : "/technician/technicians");
          break;
        case 'compte_valide':
          navigate(role === "technicien_sup" ? "/technicien-sup/technicians" : "/technician/technicians");
          break;
        default:
          navigate(role === "technicien_sup" ? "/technicien-sup/notifications" : "/technician/notifications");
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // You can add theme persistence logic here
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'intervention_creee') return <Wrench className="h-4 w-4 text-greener-600" />;
    if (type === 'intervention_validee') return <CheckCircle className="h-4 w-4 text-greener-600" />;
    if (type === 'compte_technicien') return <Users className="h-4 w-4 text-greener-600" />;
    if (type === 'compte_valide') return <CheckCircle className="h-4 w-4 text-greener-600" />;
    return <Bell className="h-4 w-4 text-gray-600" />;
  };

  const getNotificationTitle = (type: string) => {
    if (type === 'intervention_creee') return "Nouvelle intervention";
    if (type === 'intervention_validee') return "Intervention validée";
    if (type === 'compte_technicien') return "Compte technicien";
    if (type === 'compte_valide') return "Compte validé";
    return "Notification";
  };

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "Date inconnue";
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    // For older notifications, show the actual date
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Mobile-first responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 items-center py-2 sm:py-3 min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px]">
          {/* Left: Logo */}
          <div className="justify-self-start flex items-center gap-2">
            {/* Hamburger menu button for mobile */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 hover:bg-gray-100"
                title="Ouvrir le menu"
              >
                {isSidebarOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </Button>
            )}
            {/* Logo - using different logos for mobile and desktop */}
            <img 
              src="/GreenerTech-logo2.jpg" 
              alt="GreenerTech"
              className="h-10 w-auto object-contain cursor-pointer md:hidden"
              title="Accueil"
              role="button"
              tabIndex={0}
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/dashboard")}
              onKeyDown={(e) => e.key === 'Enter' && navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/dashboard")}
            />
            <img 
              src="/GreenerTech-Logo4T.png" 
              alt="GreenerTech"
              className="h-8 w-auto object-contain cursor-pointer hidden md:block"
              title="Accueil"
              role="button"
              tabIndex={0}
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/dashboard")}
              onKeyDown={(e) => e.key === 'Enter' && navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/dashboard")}
            />
          </div>

          {/* Center: Navigation Icons - Hidden on mobile */}
          <div className="justify-self-center hidden md:flex items-center gap-1 col-span-2 md:col-span-1">
            {/* Home Icon */}
            <div 
              className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95 flex-shrink-0 rounded-lg ${
                location.pathname.includes('/dashboard') || 
                (role === "technicien_sup" && location.pathname === "/technicien-sup")
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-green-50'
              }`}
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup" : "/technician/dashboard")}
              title="Accueil"
            >
              <Home className="h-5 w-6 sm:h-6 sm:w-6" />
            </div>
            
            {/* Map Icon */}
            <div 
              className={`h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95 flex-shrink-0 rounded-lg ${
                location.pathname.includes('/map') || 
                location.pathname.includes('/technician/map') ||
                location.pathname.includes('/technicien-sup/map')
                  ? 'bg-green-600 text-white'
                  : 'hover:bg-green-50'
              }`}
              onClick={() => navigate(role === "technicien_sup" ? "/technicien-sup/map" : "/technician/map")}
              title="Carte"
            >
              <Map className="h-5 w-6 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Right: Notifications and User dropdown */}
          <div className="justify-self-end flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Notification Bell Icon - for intervention requests */}
            <div className="relative group">
              <div 
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 active:scale-95 flex-shrink-0"
                onClick={handleNotifications}
                title="Demandes d'intervention"
              >
                <Bell className="h-5 w-6 sm:h-6 sm:w-6 text-black" />
                {/* Notification Badge */}
                {notificationCounts.non_vue > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-greener-600 text-white text-xs rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-xs">{notificationCounts.non_vue}</span>
                  </div>
                )}
              </div>
              
              {/* Notifications Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <span className="text-xs text-gray-500">{notificationCounts.non_vue} non lues</span>
                  </div>
                  
                  {notificationsLoading ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500">Chargement...</div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500">Aucune notification</div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification) => (
                        <div 
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
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
                      className="w-full text-center text-sm text-greener-600 hover:text-greener-700 font-medium py-2 hover:bg-greener-50 rounded-md transition-colors"
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
                <Button variant="ghost" className="px-1 sm:px-2 lg:px-3 h-8 sm:h-9">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                      <AvatarFallback className="bg-greener-100 text-greener-700 text-xs sm:text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Show name and email only on larger screens (lg and above) */}
                    <div className="text-left hidden lg:block">
                      <div className="text-sm font-medium text-gray-900 leading-none">
                        {user?.name || "Utilisateur"}
                      </div>
                      <div className="text-xs text-gray-500 leading-none truncate max-w-[12rem]">
                        {user?.email}
                      </div>
                    </div>
                    {/* Show chevron only on larger screens (lg and above) */}
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hidden lg:block" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56 z-[999999]">
                {/* Show user info only on larger screens */}
                <div className="px-2 py-1.5 hidden lg:block">
                  <div className="text-sm font-medium text-gray-900">{user?.name || "Utilisateur"}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <DropdownMenuSeparator className="hidden lg:block" />
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
};

export default TechHeader;


