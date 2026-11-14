import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/context/UserContext';
import { ApiError, apiRequest } from './apiClient';

interface DecodedToken {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
}

/**
 * Creates an account. Throws ApiError, e.g. with the server's
 * "An account with this email already exists." message for a 400.
 */
export const registerUser = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
): Promise<void> => {
    await apiRequest('/api/users/register', { method: 'POST', body: { email, firstName, lastName, password } });
};

/** Logs in, stores the session and returns the user. Throws ApiError on failure. */
export const loginUser = async (email: string, password: string): Promise<User> => {
    let data: { token: string };
    try {
        data = await apiRequest<{ token: string }>('/api/users/login', { method: 'POST', body: { email, password } });
    } catch (error) {
        // On the login endpoint a 401 means bad credentials, not an expired session.
        if (error instanceof ApiError && error.kind === 'unauthorized') {
            throw new ApiError('unauthorized', 'Incorrect email or password.', error.status);
        }
        throw error;
    }

    const decoded = jwtDecode<DecodedToken>(data.token);
    const user: User = {
        id: decoded.userId,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        token: data.token,
    };
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
};

/**
 * Registers then logs straight in. The register endpoint doesn't return a token, so
 * previously a new user landed on the dashboard unauthenticated and every call failed.
 */
export const registerAndLogin = async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
): Promise<User> => {
    await registerUser(email, firstName, lastName, password);
    return loginUser(email, password);
};
