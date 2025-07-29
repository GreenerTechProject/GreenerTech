
import axios from 'axios';

class BillonService {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api/billon';
    }

    //Exporting all billons
    async getAllBillons() {
        try {
            const response = await axios.get(`${this.baseUrl}/list`);
              return response.data;
        } catch (error) {
            console.error('Error fetching billon positions:', error);
            throw error;
        }
    }

    async saveBillon(billon) {
        try {
            const response = await axios.post(`${this.baseUrl}/save`, billon)
            return response.data;
        } catch (error) {
            console.error('Error saving billon position:', error);
            throw error;
        }
    }

    async deleteBillon(billon){
        try {
            const response = await axios.delete(`${this.baseUrl}/delete`, billon);
                        return response.data;

        } catch(error){
            console.error('Error saving billon position:', error);
            throw error;
        }
    }


}

export default BillonService;