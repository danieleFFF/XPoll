const API_BASE_URL = 'http://localhost:8080/api/polls';

import { getToken } from './AuthService';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

export const createPoll = async (pollData) => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(pollData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create poll');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const updatePoll = async (id, pollData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(pollData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update poll');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const deletePoll = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete poll');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getPollById = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch poll');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const getUserPolls = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch polls');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

const AI_API_URL = 'http://localhost:8080/api/ai';

export const generatePollFromAI = async (prompt) => {
    try {
        const response = await fetch(`${AI_API_URL}/generate-poll`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate poll');
        }

        return await response.json();
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};

export const generateAnswersFromAI = async (question) => {
    try {
        const response = await fetch(`${AI_API_URL}/generate-answers`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ question }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate answers');
        }

        return await response.json();
    } catch (error) {
        console.error("AI Answer Generation Error:", error);
        throw error;
    }
};
