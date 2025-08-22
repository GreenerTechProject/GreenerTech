import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button, 
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import alertsService, { Alert, AlertFilters } from '../services/alertsService';

const TechnicianAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [assignedSerres, setAssignedSerres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await alertsService.getAlerts();
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading alerts...</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Alerts Management
      </Typography>
      <Box>
        {alerts.map((alert) => (
          <Box key={alert.id} p={2} border={1} mb={2}>
            <Typography variant="h6">{alert.type}</Typography>
            <Typography>{alert.message}</Typography>
            <Typography>Serre: {alert.serreName}</Typography>
            <Typography>Status: {alert.status}</Typography>
            <Typography>Severity: {alert.severity}</Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default TechnicianAlerts;
