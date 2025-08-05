import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AlertBanner from '@/components/AlertBanner';
import { useAlerts } from '@/hooks/useAlerts';

export function AlertDemo() {
  const alerts = useAlerts();
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'success' | 'error' | 'warning' | 'info' | 'loading'>('info');

  const handleAsyncDemo = async () => {
    await alerts.handleAsyncOperation(
      async () => {
        // Simulate an API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { data: 'Success!' };
      },
      {
        loadingMessage: 'Processing your request...',
        successMessage: 'Operation completed successfully!',
        errorMessage: 'Operation failed. Please try again.',
      }
    );
  };

  const handleFormDemo = async () => {
    await alerts.handleFormSubmission(
      async () => {
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { id: 123, name: 'Test Data' };
      },
      {
        loadingMessage: 'Saving form data...',
        successMessage: 'Form saved successfully!',
        onSuccess: (data) => console.log('Form data:', data),
        onError: (error) => console.error('Form error:', error),
      }
    );
  };

  const simulateError = async () => {
    try {
      await alerts.handleAsyncOperation(
        async () => {
          await new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 1000)
          );
        },
        {
          loadingMessage: 'Attempting connection...',
          errorMessage: 'Failed to connect to server',
        }
      );
    } catch (error) {
      // Error is already handled by the alert system
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Alert System Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive alert and notification system for the GreenerTech application
        </p>
      </div>

      {/* Banner Alerts Demo */}
      {showBanner && (
        <AlertBanner
          type={bannerType}
          title={`${bannerType.charAt(0).toUpperCase() + bannerType.slice(1)} Alert`}
          message="This is a persistent banner alert that appears at the top of the page."
          onDismiss={() => setShowBanner(false)}
          action={{
            label: 'Take Action',
            onClick: () => alerts.showInfo('Action button clicked!'),
          }}
        />
      )}

      {/* Basic Toast Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Toast Alerts</CardTitle>
          <CardDescription>
            Quick notification toasts that appear in the corner of the screen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => alerts.showSuccess('This is a success message!')}
              className="bg-green-600 hover:bg-green-700"
            >
              Success
            </Button>
            <Button
              onClick={() => alerts.showError('This is an error message!')}
              variant="destructive"
            >
              Error
            </Button>
            <Button
              onClick={() => alerts.showWarning('This is a warning message!')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Warning
            </Button>
            <Button
              onClick={() => alerts.showInfo('This is an info message!')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Info
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Specialized Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Specialized Alerts</CardTitle>
          <CardDescription>
            Pre-configured alerts for common scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button
              onClick={() => alerts.showNetworkError()}
              variant="outline"
            >
              Network Error
            </Button>
            <Button
              onClick={() => alerts.showValidationError('Please fill in all required fields')}
              variant="outline"
            >
              Validation Error
            </Button>
            <Button
              onClick={() => alerts.showPermissionDenied()}
              variant="outline"
            >
              Permission Denied
            </Button>
            <Button
              onClick={() => alerts.showSaveSuccess('Greenhouse')}
              variant="outline"
            >
              Save Success
            </Button>
            <Button
              onClick={() => alerts.showDeleteSuccess('Domain')}
              variant="outline"
            >
              Delete Success
            </Button>
            <Button
              onClick={() => alerts.showUpdateSuccess('Profile')}
              variant="outline"
            >
              Update Success
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banner Alerts Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Banner Alerts</CardTitle>
          <CardDescription>
            Persistent alerts that appear prominently on the page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['success', 'error', 'warning', 'info', 'loading'] as const).map((type) => (
              <Badge
                key={type}
                variant={bannerType === type ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setBannerType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
          <Button
            onClick={() => setShowBanner(true)}
            variant="outline"
            className="w-full"
          >
            Show Banner Alert ({bannerType})
          </Button>
        </CardContent>
      </Card>

      {/* Async Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Async Operation Helpers</CardTitle>
          <CardDescription>
            Built-in helpers for handling loading states and async operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={handleAsyncDemo} variant="outline">
              Async Operation
            </Button>
            <Button onClick={handleFormDemo} variant="outline">
              Form Submission
            </Button>
            <Button onClick={simulateError} variant="outline">
              Simulate Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Options */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Options</CardTitle>
          <CardDescription>
            Alerts with custom titles, durations, and actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => alerts.showSuccess('Data synchronized successfully!', {
                title: 'Sync Complete',
                duration: 3000,
              })}
              variant="outline"
            >
              Custom Success
            </Button>
            <Button
              onClick={() => alerts.showError('Server is temporarily unavailable', {
                title: 'Service Unavailable',
                duration: 8000,
              })}
              variant="outline"
            >
              Custom Error
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <p><strong>Import the hook:</strong></p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
              import &#123; useAlerts &#125; from '@/hooks/useAlerts';
            </code>
            
            <p><strong>Use in component:</strong></p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
              const alerts = useAlerts();<br/>
              alerts.showSuccess('Operation completed!');
            </code>

            <p><strong>For banner alerts:</strong></p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
              import AlertBanner from '@/components/AlertBanner';<br/>
              &lt;AlertBanner type="warning" message="Important notice!" /&gt;
            </code>
          </div>

          <Button
            onClick={() => alerts.dismissAll()}
            variant="outline"
            className="w-full"
          >
            Dismiss All Alerts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertDemo;
