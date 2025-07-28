import axios from 'axios';

export default class InscriptionService {
    constructor() {
        this.baseUrl = 'register/director';
    }

    // Registering director
    async registerDirector(directorData) {
        try {
            const response = await axios.post(`${this.baseUrl}`, directorData);
            return response.data;
        } catch (error) {
            console.error('Error registering director:', error);
            throw this._handleError(error, 'Failed to register director');
        }
    }

    // Registering technician with the flow you described
    async registerTechnician(technicianData) {
        try {
            // First check if technician exists
            const checkResponse = await this._checkTechnicianEmail(technicianData.email);
            
            if (checkResponse.exists) {
                return {
                    status: 'exists',
                    message: 'Technician already exists',
                    data: checkResponse.user,
                    shouldProceed: false
                };
            }

            // If not exists, proceed with registration demand
            const demandResponse = await this._sendTechnicianDemand(technicianData);
            
            return {
                status: 'demand_created',
                message: 'Registration request sent to director',
                data: demandResponse,
                shouldProceed: true
            };

        } catch (error) {
            console.error('Error in technician registration flow:', error);
            throw this._handleError(error, 'Failed to process technician registration');
        }
    }

    // Check if email exists (can be used separately if needed)
    async checkEmailExists(email) {
        try {
            const response = await axios.post(`${this.baseUrl}/users/check-email`, { email });
            return response.data.exists;
        } catch (error) {
            console.error('Error checking email:', error);
            throw this._handleError(error, 'Failed to check email');
        }
    }

    // Private helper methods
    async _checkTechnicianEmail(email) {
        const response = await axios.post(`${this.baseUrl}/technician/email/check`, { email });
        return response.data;
    }

    async _sendTechnicianDemand(technicianData) {
        const response = await axios.post(`${this.baseUrl}/technician/email/demand`, technicianData);
        return response.data;
    }

    _handleError(error, defaultMessage) {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error ||
                            error.message;
        
        const status = error.response?.status;
        
        return new Error(`${defaultMessage}: ${status ? `Status ${status} - ` : ''}${errorMessage}`);
    }
}