// JWT Utility Functions
export function getCurrentUserId(): number {
    const token = localStorage.getItem('authToken');
    if (!token) return -1;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id;
    } catch {
        return -1;
    }
}

export function decodeJWT(token: string): any {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch {
        return null;
    }
}
