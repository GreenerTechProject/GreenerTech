import { toast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactElement;
}

class AlertService {
  private static instance: AlertService;

  private constructor() {}

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Show a success alert
   */
  success(message: string, options?: AlertOptions) {
    return toast({
      title: options?.title || "Success",
      description: message,
      variant: "default",
      className: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200",
      action: options?.action,
      duration: options?.duration || 5000,
    });
  }

  /**
   * Show an error alert
   */
  error(message: string, options?: AlertOptions) {
    return toast({
      title: options?.title || "Error",
      description: message,
      variant: "destructive",
      action: options?.action,
      duration: options?.duration || 7000,
    });
  }

  /**
   * Show a warning alert
   */
  warning(message: string, options?: AlertOptions) {
    return toast({
      title: options?.title || "Warning",
      description: message,
      variant: "default",
      className: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      action: options?.action,
      duration: options?.duration || 6000,
    });
  }

  /**
   * Show an info alert
   */
  info(message: string, options?: AlertOptions) {
    return toast({
      title: options?.title || "Information",
      description: message,
      variant: "default",
      className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200",
      action: options?.action,
      duration: options?.duration || 5000,
    });
  }

  /**
   * Show a custom alert with specific styling
   */
  custom(type: AlertType, message: string, options?: AlertOptions) {
    switch (type) {
      case 'success':
        return this.success(message, options);
      case 'error':
        return this.error(message, options);
      case 'warning':
        return this.warning(message, options);
      case 'info':
        return this.info(message, options);
      default:
        return this.info(message, options);
    }
  }

  /**
   * Show a loading alert that can be updated
   */
  loading(message: string, options?: Omit<AlertOptions, 'duration'>) {
    return toast({
      title: options?.title || "Loading...",
      description: message,
      variant: "default",
      className: "border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
      action: options?.action,
      duration: Infinity, // Keep loading toast until manually dismissed
    });
  }

  /**
   * Network error alert helper
   */
  networkError(message?: string) {
    return this.error(
      message || "Network error occurred. Please check your connection and try again.",
      { title: "Connection Error" }
    );
  }

  /**
   * Validation error alert helper
   */
  validationError(message: string) {
    return this.warning(message, { title: "Validation Error" });
  }

  /**
   * Permission denied alert helper
   */
  permissionDenied(message?: string) {
    return this.error(
      message || "You don't have permission to perform this action.",
      { title: "Access Denied" }
    );
  }

  /**
   * Save success alert helper
   */
  saveSuccess(entityName?: string) {
    return this.success(
      `${entityName || 'Data'} has been saved successfully.`,
      { title: "Saved" }
    );
  }

  /**
   * Delete success alert helper
   */
  deleteSuccess(entityName?: string) {
    return this.success(
      `${entityName || 'Item'} has been deleted successfully.`,
      { title: "Deleted" }
    );
  }

  /**
   * Update success alert helper
   */
  updateSuccess(entityName?: string) {
    return this.success(
      `${entityName || 'Data'} has been updated successfully.`,
      { title: "Updated" }
    );
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    // This uses the toast dismiss function to clear all active toasts
    return toast({ title: "", description: "", duration: 0 });
  }
}

// Export singleton instance
export const alertService = AlertService.getInstance();

// Export convenience functions for easier imports
export const showAlert = alertService.custom.bind(alertService);
export const showSuccess = alertService.success.bind(alertService);
export const showError = alertService.error.bind(alertService);
export const showWarning = alertService.warning.bind(alertService);
export const showInfo = alertService.info.bind(alertService);
export const showLoading = alertService.loading.bind(alertService);

// Export specialized helpers
export const showNetworkError = alertService.networkError.bind(alertService);
export const showValidationError = alertService.validationError.bind(alertService);
export const showPermissionDenied = alertService.permissionDenied.bind(alertService);
export const showSaveSuccess = alertService.saveSuccess.bind(alertService);
export const showDeleteSuccess = alertService.deleteSuccess.bind(alertService);
export const showUpdateSuccess = alertService.updateSuccess.bind(alertService);

export default alertService;
