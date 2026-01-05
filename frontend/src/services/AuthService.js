const API_BASE_URL = 'http://localhost:8080/api/auth';

//Manages authentication and user profile

export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('user', JSON.stringify(data));
        }
        return data;
    } catch (error) {
        throw error;
    }
};

export const register = async (name, email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('user', JSON.stringify(data));
        }
        return data;
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    localStorage.removeItem('user');
    try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST' });
    } catch (e) {
        console.error("Logout failed on server", e);
    }
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const getToken = () => {
    const user = getCurrentUser();
    return user?.token;
};

//Makes authenticated requests.
const authFetch = async (url, options = {}) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers, };

    if (token){ headers['Authorization'] = `Bearer ${token}`; }

    const response = await fetch(url, { ...options, headers });

    return response;
};

//Gets full user profile from server
export const getUserProfile = async () => {
    const response = await authFetch('http://localhost:8080/api/users/me');

    if (!response.ok){ throw new Error('Failed to fetch user profile'); }

    return response.json();
};

// Update username.
export const updateUsername = async (username) => {
    const response = await authFetch('http://localhost:8080/api/users/me/username', {
        method: 'PUT',
        body: JSON.stringify({ username }),
    });

    if(!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update username');
    }

    const updatedUser = await response.json();

    //Updates local storage with new username.
    const currentUser = getCurrentUser();

    if(currentUser){
        currentUser.username = updatedUser.username;
        localStorage.setItem('user', JSON.stringify(currentUser));
    }

    return updatedUser;
};

//changes password (only for local users).
export const changePassword = async (currentPassword, newPassword) => {
    const response = await authFetch('http://localhost:8080/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
    }
    return response.json();
};

//Get user's created polls.
export const getMyPolls = async () => {
    const response = await authFetch('http://localhost:8080/api/polls/my-polls');

    if(!response.ok) { throw new Error('Failed to fetch polls');}

    return response.json();
};

//Get user's participation history
export const getMyParticipations = async () => {
    const response = await authFetch('http://localhost:8080/api/users/me/participations');

    if (!response.ok) { throw new Error('Failed to fetch participation history'); }

    return response.json();
};