import React, { createContext, useContext, ReactNode } from 'react';
import { alertService, AlertType, AlertOptions } from '@/services/alertService';

interface AlertContextType {
  showAlert: (type: AlertType, message: string, options?: AlertOptions) => void;
  showSuccess: (message: string, options?: AlertOptions) => void;
  showError: (message: string, options?: AlertOptions) => void;
  showWarning: (message: string, options?: AlertOptions) => void;
  showInfo: (message: string, options?: AlertOptions) => void;
  showLoading: (message: string, options?: Omit<AlertOptions, 'duration'>) => void;
  showNetworkError: (message?: string) => void;
  showValidationError: (message: string) => void;
  showPermissionDenied: (message?: string) => void;
  showSaveSuccess: (entityName?: string) => void;
  showDeleteSuccess: (entityName?: string) => void;
  showUpdateSuccess: (entityName?: string) => void;
  dismissAll: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const contextValue: AlertContextType = {
    showAlert: alertService.custom.bind(alertService),
    showSuccess: alertService.success.bind(alertService),
    showError: alertService.error.bind(alertService),
    showWarning: alertService.warning.bind(alertService),
    showInfo: alertService.info.bind(alertService),
    showLoading: alertService.loading.bind(alertService),
    showNetworkError: alertService.networkError.bind(alertService),
    showValidationError: alertService.validationError.bind(alertService),
    showPermissionDenied: alertService.permissionDenied.bind(alertService),
    showSaveSuccess: alertService.saveSuccess.bind(alertService),
    showDeleteSuccess: alertService.deleteSuccess.bind(alertService),
    showUpdateSuccess: alertService.updateSuccess.bind(alertService),
    dismissAll: alertService.dismissAll.bind(alertService),
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}

export default AlertContext;
