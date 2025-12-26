import { ENDPOINTS } from "./Endpoints";


const getBackendUrl = () => {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`; 
};

const signUpApi = async (username: string, email: string, password: string) =>
{
  const payload = { username, email, password };

  const response = await fetch(`${getBackendUrl()}/api/user/signUp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(errorData?.message || `${response.status}`);
  }

  return response.json();
};

export default signUpApi;