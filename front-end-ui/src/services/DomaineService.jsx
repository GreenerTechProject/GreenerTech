import React from 'react';
import axios from 'axios';
// Here we need to work with api Interceptors to handle the API URL dynamically
const LOCAL_API_URL = process.env.REACT_APP_LOCAL_API ;
export class DomaineService { 
    async getAllDomains() {
        try {
            const response = await axios.get(`${LOCAL_API_URL}/domaine/list`);
            return response.data;
        } catch (error) {
            console.error('Error fetching domaine list:', error);
            throw error;
        }
    }
    
    async saveDomaine(domaine) {
        try {
            const response = await axios.post(`${LOCAL_API_URL}/domaine/save`, domaine);
            return response.data;
        } catch (error) {
            console.error('Error saving domaine:', error);
            throw error;
        }
    }
}