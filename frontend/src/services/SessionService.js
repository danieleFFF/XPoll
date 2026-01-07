const API_BASE_URL = 'http://localhost:8080/api/sessions';
import { getToken } from './AuthService';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

export const createSessionFromPoll = async (pollId, creatorId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/create-from-poll`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ pollId, creatorId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create session');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getSession = async (code) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${code}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch session');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};
