import React from 'react';
import api from '../axios/api';

const LOCAL_API_URL = process.env.REACT_APP_LOCAL_API ;
export class DomaineService { 

    async getAllDomains() {
        try {
            const response = await api.get(`${LOCAL_API_URL}/domaine/list`);
            return response.data;
        } catch (error) {
            console.error('Error fetching domaine list:', error);
            throw error;
        }
    }
    
    // Get a single Domaine
    getDomaine = async (id) => {
    try {
        const response = await api.get(`${API_URL}/domaines/${id}`, authHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
    };

    async saveDomaine(domaine) {
        try {
            const response = await api.post(`${LOCAL_API_URL}/domaine/save`, domaine);
            return response.data;
        } catch (error) {
            console.error('Error saving domaine:', error);
            throw error;
        }
    }

    updateDomaine = async (id, data) => {
        try {
            const response = await api.put(`${API_URL}/domaines/${id}`, data, authHeader());
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    };

    deleteDomaine = async (id) => {
        try {
            const response = await api.delete(`${API_URL}/domaines/${id}`, authHeader());
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    };

    // Get Serres by Domaine
    getSerresByDomaine = async (idDomaine) => {
    try {
        const response = await api.get(`${API_URL}/domaines/${idDomaine}/serres`, authHeader());
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
    };
}