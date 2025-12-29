// Tournament Utility Functions
export function generateTournamentCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export function generatePlayerAlias(): string {
    const adjectives = ['Quick', 'Swift', 'Bold', 'Brave', 'Fierce', 'Smart', 'Epic', 'Wild', 'Cool', 'Pro'];
    const nouns = ['Tiger', 'Dragon', 'Eagle', 'Wolf', 'Falcon', 'Lion', 'Bear', 'Hawk', 'Fox', 'Shark'];
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    
    return `${adj}${noun}${num}`;
}

export function isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
}

export function nextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
        power *= 2;
    }
    return power;
}

export function calculateRounds(capacity: number): number {
    return Math.log2(capacity);
}
