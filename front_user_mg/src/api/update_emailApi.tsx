import { ENDPOINTS } from "./Endpoints";
import Cookies from "js-cookie";


const update_emailApi = async (password:string, newAddress: string, ConAddress:string) => {
    const payload =
    {
        password: password,
        newAddress: newAddress,
        conAddress: ConAddress
    };
    
    if (newAddress !== ConAddress)
    {
        throw new Error('mismatched email Addresses');
    }
    let token = Cookies.get('jwt');
    const response = await fetch("http://localhost:3000/api/user/update_email", {
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

export default update_emailApi;