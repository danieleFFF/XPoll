const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth`;

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
