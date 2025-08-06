import React from "react";
import { AlertTriangle, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { AlertStats } from "@/types/alert";

interface AlertStatsCardsProps {
  stats: AlertStats;
  loading?: boolean;
}

export default function AlertStatsCards({ stats, loading = false }: AlertStatsCardsProps) {
  const statsConfig = [
    {
      title: "Alertes Non Résolues",
      value: stats.unresolvedAlerts,
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      valueColor: "text-red-600",
    },
    {
      title: "Alertes Résolues",
      value: stats.resolvedAlerts,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
    {
      title: "Temps Moyen de Résolution",
      value: `${stats.averageResolutionTime}h`,
      icon: Clock,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      valueColor: "text-orange-600",
    },
    {
      title: "Total Alertes",
      value: stats.totalAlerts,
      icon: BarChart3,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ${stat.bgColor}`}
              >
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className={`text-2xl font-bold ${stat.valueColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
