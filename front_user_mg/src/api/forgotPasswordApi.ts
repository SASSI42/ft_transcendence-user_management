import { ENDPOINTS } from "./Endpoints";

const ForgotPassword = async (email: string) => {
    const payload = {
        email: email
    };

    const response = await fetch("http://localhost:3000/api/user/forgot-password", {
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