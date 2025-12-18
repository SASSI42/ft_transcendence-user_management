import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const isLoggedIn = !!token;

    const login = (newToken) => {
        setToken(newToken);
        localStorage.setItem('authToken', newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('authToken');
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext)!;
};