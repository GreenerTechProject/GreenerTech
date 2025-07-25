import React from 'react';
import axios from 'axios';
// Here we need to work with api Interceptors to handle the API URL dynamically
const LOCAL_API_URL = process.env.REACT_APP_LOCAL_API ;
export class SerreService {

    async saveSerre(serre) {
        try {
            const response = await axios.post(`${this.baseUrl}/serre/save`, serre)
            return response.data;
        } catch (error) {
            console.error('Error saving billon position:', error);
            throw error;
        }
    }

    async getAllSerre() {
         try {
            const response = await axios.get(`${LOCAL_API_URL}/serre/list`);
              return response.data;
        } catch (error) {
            console.error('Error fetching billon positions:', error);
            throw error;
        }
    }

    async deleteSerre(serreId) {
        try {
            const response = await axios.delete(`${LOCAL_API_URL}/serre/delete/${serreId}`);
            return response.data;

        }catch (error) {
            console.error('Error deleting serre:', error);
            throw error;
        }
    }
    
}