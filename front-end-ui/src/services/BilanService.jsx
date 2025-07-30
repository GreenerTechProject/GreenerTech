
import axios from 'axios';

class BilanService {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api/bilan';
    }

    //Exporting all bilans
    async getAllBilan() {
        try {
            const response = await axios.get(`${this.baseUrl}/list`);
              return response.data;
        } catch (error) {
            console.error('Error fetching bilan positions:', error);
            throw error;
        }
    }

    getBilan = async (id) => {
        try {
            const response = await axios.get(`/bilan/${id}`);
            return response.data;
        } catch(err){
            console.error('Error fetching bilan:', error);
            throw error;
        }
    };

    getBilansBySerre = async (serre_id) => {
        try {
            const response = await axios.get(`/bilans/${serre_id}`);
            return response.data;
        } catch(err){
            console.error('Error fetching bilan by serre:', error);
            throw error;
        }
      
    }

    getBilanQrCode = async (bilan_id) => {
        try {
            const response = await axios.get(`/bilan_qrcode/${bilan_id}`, {
            responseType: 'blob', 
            });
            return response.data;
        } catch (err){
            console.error('Error fetching bilan qrcode:', error);
            throw error;
        } 
    };

    async saveBilan(bilan) {
        try {
            const response = await axios.post(`${this.baseUrl}/save`, bilan)
            return response.data;
        } catch (error) {
            console.error('Error saving bilan position:', error);
            throw error;
        }
    }

    updateBilan = async (id, updatedData) => {
        try {
            const response = await axios.put(`/bilan/${id}`, updatedData);
            return response.data;
        } catch(err){
            console.error('Error updating bilan:', error);
        }
    };

    async deleteBilan(bilan){
        try {
            const response = await axios.delete(`${this.baseUrl}/delete`, bilan);
                        return response.data;

        } catch(error){
            console.error('Error saving bilan position:', error);
            throw error;
        }
    }


}

export default BilanService;