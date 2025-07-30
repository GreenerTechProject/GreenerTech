import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import BilanService from './BilanService';

vi.mock('axios');

describe('BillonService', () => {
  it('should fetch bilna positions successfully', async () => {
    const mockPositions = [
      {
        bilan_id: 1,
        bilan_name: 'Billon A',
        points: [
          { lat: 30.410509, lng: -9.555253, order_point: 1 },
          { lat: 30.4108, lng: -9.5548, order_point: 2 },
          { lat: 30.4103, lng: -9.5545, order_point: 3 },
          { lat: 30.4099, lng: -9.5551, order_point: 4 },
        ],
      },
      {
        bilan_id: 2,
        bilan_name: 'Billon B',
        points: [
          { lat: 30.40982, lng: -9.5557, order_point: 1 },
          { lat: 30.41012, lng: -9.55523, order_point: 2 },
          { lat: 30.40995, lng: -9.55485, order_point: 3 },
          { lat: 30.40965, lng: -9.55532, order_point: 4 },
        ],
      },
    ];

    vi.mocked(axios.get).mockResolvedValue({ data: mockPositions });

    const service = new BillonService();
    const positions = await service.getAllBillons();

    expect(positions).toEqual(mockPositions);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/bilan/list');
  });

  it('should save bilan position successfully', async () => {
    const mockPosition = { lat: 34.0522, lng: -118.2437 };
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

    const service = new BillonService();
    const response = await service.saveBillon(mockPosition);

    expect(response).toEqual({ success: true });
    expect(axios.post).toHaveBeenCalledWith('http://localhost:8080/api/bilan/save', mockPosition);
  });

  it('should delete bilan on maps', async () => {
    const mockBillon = {
      points: [
        { lat: 30.40982, lng: -9.5557, order_point: 1 },
        { lat: 30.41012, lng: -9.55523, order_point: 2 },
        { lat: 30.40995, lng: -9.55485, order_point: 3 },
        { lat: 30.40965, lng: -9.55532, order_point: 4 },
      ],
      info: {
        bilan_id: 4,
        bilan_name: 'Billon 4',
      },
    };

    vi.mocked(axios.delete).mockResolvedValue({ data: { success: true } });

    const service = new BillonService();
    const response = await service.deleteBillon(mockBillon);

    expect(response).toEqual({ success: true });
    expect(axios.delete).toHaveBeenCalledWith('http://localhost:8080/api/bilan/delete', mockBillon);
  });
});
