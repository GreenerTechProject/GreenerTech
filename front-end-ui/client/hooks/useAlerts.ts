import { useCallback } from 'react';
import { alertService, AlertType, AlertOptions } from '@/services/alertService';

export interface UseAlertsReturn {
  // Core alert functions
  showAlert: (type: AlertType, message: string, options?: AlertOptions) => void;
  showSuccess: (message: string, options?: AlertOptions) => void;
  showError: (message: string, options?: AlertOptions) => void;
  showWarning: (message: string, options?: AlertOptions) => void;
  showInfo: (message: string, options?: AlertOptions) => void;
  showLoading: (message: string, options?: Omit<AlertOptions, 'duration'>) => void;
  
  // Specialized alert helpers
  showNetworkError: (message?: string) => void;
  showValidationError: (message: string) => void;
  showPermissionDenied: (message?: string) => void;
  showSaveSuccess: (entityName?: string) => void;
  showDeleteSuccess: (entityName?: string) => void;
  showUpdateSuccess: (entityName?: string) => void;
  
  // Utility functions
  dismissAll: () => void;
  
  // Async operation helpers
  handleAsyncOperation: <T>(
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showLoading?: boolean;
    }
  ) => Promise<T>;
  
  // Form submission helper
  handleFormSubmission: <T>(
    onSubmit: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    }
  ) => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
  // Core alert functions
  const showAlert = useCallback((type: AlertType, message: string, options?: AlertOptions) => {
    return alertService.custom(type, message, options);
  }, []);

  const showSuccess = useCallback((message: string, options?: AlertOptions) => {
    return alertService.success(message, options);
  }, []);

  const showError = useCallback((message: string, options?: AlertOptions) => {
    return alertService.error(message, options);
  }, []);

  const showWarning = useCallback((message: string, options?: AlertOptions) => {
    return alertService.warning(message, options);
  }, []);

  const showInfo = useCallback((message: string, options?: AlertOptions) => {
    return alertService.info(message, options);
  }, []);

  const showLoading = useCallback((message: string, options?: Omit<AlertOptions, 'duration'>) => {
    return alertService.loading(message, options);
  }, []);

  // Specialized alert helpers
  const showNetworkError = useCallback((message?: string) => {
    return alertService.networkError(message);
  }, []);

  const showValidationError = useCallback((message: string) => {
    return alertService.validationError(message);
  }, []);

  const showPermissionDenied = useCallback((message?: string) => {
    return alertService.permissionDenied(message);
  }, []);

  const showSaveSuccess = useCallback((entityName?: string) => {
    return alertService.saveSuccess(entityName);
  }, []);

  const showDeleteSuccess = useCallback((entityName?: string) => {
    return alertService.deleteSuccess(entityName);
  }, []);

  const showUpdateSuccess = useCallback((entityName?: string) => {
    return alertService.updateSuccess(entityName);
  }, []);

  const dismissAll = useCallback(() => {
    return alertService.dismissAll();
  }, []);

  // Async operation helper
  const handleAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showLoading?: boolean;
    }
  ): Promise<T> => {
    const {
      loadingMessage = 'Processing...',
      successMessage,
      errorMessage,
      showLoading: shouldShowLoading = true,
    } = options || {};

    let loadingToast: ReturnType<typeof alertService.loading> | null = null;

    try {
      if (shouldShowLoading) {
        loadingToast = alertService.loading(loadingMessage);
      }

      const result = await operation();

      if (loadingToast) {
        loadingToast.dismiss();
      }

      if (successMessage) {
        alertService.success(successMessage);
      }

      return result;
    } catch (error) {
      if (loadingToast) {
        loadingToast.dismiss();
      }

      const message = errorMessage || 
        (error instanceof Error ? error.message : 'An error occurred');
      
      alertService.error(message);
      throw error;
    }
  }, []);

  // Form submission helper
  const handleFormSubmission = useCallback(async <T>(
    onSubmit: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      successMessage?: string;
      onSuccess?: (data: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> => {
    const {
      loadingMessage = 'Submitting...',
      successMessage = 'Form submitted successfully',
      onSuccess,
      onError,
    } = options || {};

    try {
      const result = await handleAsyncOperation(onSubmit, {
        loadingMessage,
        successMessage,
        showLoading: true,
      });

      onSuccess?.(result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Submission failed');
      onError?.(err);
    }
  }, [handleAsyncOperation]);

  return {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showNetworkError,
    showValidationError,
    showPermissionDenied,
    showSaveSuccess,
    showDeleteSuccess,
    showUpdateSuccess,
    dismissAll,
    handleAsyncOperation,
    handleFormSubmission,
  };
}

export default useAlerts;
