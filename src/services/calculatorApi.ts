import axios from 'axios';
import { BASE_URL } from '../config/config';
import { CalculateRewardsRequest, CalculateRewardsResult, ApiResponse } from '../types/calculator';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

/**
 * Calls backend POST /api/calculate-rewards
 */
export async function calculateRewardsApi(
  payload: CalculateRewardsRequest
): Promise<CalculateRewardsResult> {
  try {
    const response = await apiClient.post<ApiResponse<CalculateRewardsResult>>(
      '/api/calculate-rewards',
      payload
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.error || 'Failed to calculate rewards.');
  } catch (error: any) {
    if (error.response && error.response.data) {
      const errData = error.response.data;
      const details = Array.isArray(errData.details) ? errData.details.join(', ') : '';
      const message = errData.error 
        ? `${errData.error}${details ? `: ${details}` : ''}`
        : 'Calculation failed';
      throw new Error(message);
    }
    throw new Error(error.message || 'Network error connecting to calculation server.');
  }
}

