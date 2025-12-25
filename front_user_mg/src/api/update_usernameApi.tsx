import { ENDPOINTS } from "./Endpoints";
import Cookies from "js-cookie";


const update_emailApi = async (password:string, newUsername: string, conUsername:string) => {
    const payload = {
        password: password,
        newName: newUsername,
        confirmName:conUsername
    };
    if (newUsername !== conUsername)
    {
        throw new Error('mismatched usernames');
    }
    let token = Cookies.get('jwt');
    const response = await fetch("http://localhost:3000/api/user/update_username", {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(errorData?.message || `${response.status}`);
    }
    return response.json();
};

export default update_emailApi;