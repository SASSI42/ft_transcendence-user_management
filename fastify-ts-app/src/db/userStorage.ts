// Temporary user storage for tournament participants
// Maps alias to a temporary user ID for game room management

const userIdMap = new Map<string, number>();
let nextUserId = 100000; // Start from high number to avoid conflicts with real user IDs

export function getOrCreateUserId(alias: string): number {
    const existing = userIdMap.get(alias);
    if (existing !== undefined) {
        return existing;
    }
    const newId = nextUserId++;
    userIdMap.set(alias, newId);
    return newId;
}

export function clearUserCache(): void {
    userIdMap.clear();
}
