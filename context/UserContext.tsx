import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    token: string;
}

interface UserContextProps {
    user: User | null;
    setUser: (user: User | null) => void;
    /** Forgets the stored session (the caller decides where to navigate). */
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
          try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          } catch (err) {
            console.error("Failed to load user:", err);
          }
        };
        loadUser();
      }, []);

    const logout = useCallback(async () => {
        setUser(null);
        try {
            await AsyncStorage.removeItem('user');
        } catch (err) {
            console.error('Failed to clear stored user:', err);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextProps => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};