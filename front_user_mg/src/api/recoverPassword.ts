import { ENDPOINTS } from "./Endpoints";
import Cookies from "js-cookie";

const RecoverPasswordApi = async (newPassword: string, confirmPassword:string) => {
    const payload = {
        'NewPassword': newPassword,
    };
    if (newPassword !== confirmPassword)
    {
        throw new Error('mismatched passwords');
    }
    let token = Cookies.get('jwt');
    const response = await fetch("http://localhost:3000/api/user/reset-password", {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : '',
            "x-mock-response-name" : "reset-success"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(errorData.message || `${response.status}`);
    }

    return response.json();
};

export default RecoverPasswordApi;