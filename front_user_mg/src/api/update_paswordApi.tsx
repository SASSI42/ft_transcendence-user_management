import { ENDPOINTS } from "./Endpoints";
import Cookies from "js-cookie";


const getBackendUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`; 
};


const update_passwordApi = async (oldPass: string, newPass: string, conPass:string) => {
    const payload = {
        oldPassword: oldPass,
        newPassword: newPass,
    };
    if (newPass !== conPass)
    {
        throw new Error('mismatched passwords');
    }
    let token = Cookies.get('jwt');
    const response = await fetch(`${getBackendUrl()}/api/user/update_password`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}`:''
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(errorData?.message || `${response.status}`);
    }
    return response.json();
};

export default update_passwordApi;