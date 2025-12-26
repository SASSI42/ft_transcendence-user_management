import { ENDPOINTS } from "./Endpoints";

const getBackendUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`; 
};

const signInApi = async (email: string, password: string) => {
    const payload = {
        email: email,
        password: password 
    };

    const response = await fetch(`${getBackendUrl()}/login/google`, {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "X-Mock-Response-name": "success"
        },
        body: JSON.stringify(payload)
        
    });

    if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.message || `${response.status}`);
    }

    return response.json();
};

export default signInApi;