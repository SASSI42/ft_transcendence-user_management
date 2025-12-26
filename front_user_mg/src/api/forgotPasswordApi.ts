import { ENDPOINTS } from "./Endpoints";

const getBackendUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`; 
};

const ForgotPassword = async (email: string) => {
    const payload = {
        email: email
    };

    const response = await fetch(`${getBackendUrl()}/api/user/forgot-password`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "x-mock-response-name" : "forgot-rate-limit"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.message || `${response.status}`);
    }
    return response.json();
};

export default ForgotPassword;