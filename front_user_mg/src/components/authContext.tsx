import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// Helper to decode JWT without an external library
const parseJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export interface User {
    id: number; // 🛠️ UPDATED: Now a number to match your DB
    username: string;
}

interface AuthContextType {
    isLoggedIn: boolean;
    token: string | null;
    user: User | null;
    login: (newToken: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (token) {
            const decoded = parseJwt(token);
            if (decoded) {
                // 🛠️ CRITICAL FIX: Convert 'sub' (string) to Number
                // We also check 'decoded.id' just in case your backend uses that key
                const rawId = decoded.sub || decoded.id;
                
                setUser({
                    id: Number(rawId), 
                    username: decoded.name || decoded.username || "Unknown"
                });
            }
        } else {
            setUser(null);
        }
    }, [token]);

    const login = (newToken: string) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
    };

    const isLoggedIn = !!token;

    return (
        <AuthContext.Provider value={{ isLoggedIn, token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext)!;
};