import { ENDPOINTS } from "./Endpoints";


const signUpApi = async (username: string, email: string, password: string) =>
{
  const payload = { username, email, password };

  const response = await fetch("http://localhost:3000/api/user/signUp", {
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