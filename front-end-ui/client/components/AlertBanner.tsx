import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertBannerType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface AlertBannerProps {
  type: AlertBannerType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const alertConfig = {
  success: {
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200',
    iconClassName: 'text-green-500',
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200',
    iconClassName: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    iconClassName: 'text-yellow-500',
  },
  info: {
    icon: Info,
    className: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconClassName: 'text-blue-500',
  },
  loading: {
    icon: Loader2,
    className: 'border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200',
    iconClassName: 'text-gray-500 animate-spin',
  },
};

export function AlertBanner({
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
  action,
  className,
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = alertConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{message}</AlertDescription>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="h-8 text-sm"
          >
            {action.label}
          </Button>
        )}
        
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 hover:bg-transparent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}

export default AlertBanner;
