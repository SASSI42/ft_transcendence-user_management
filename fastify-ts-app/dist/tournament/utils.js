"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTournamentCode = generateTournamentCode;
exports.generatePlayerAlias = generatePlayerAlias;
exports.isPowerOfTwo = isPowerOfTwo;
exports.nextPowerOfTwo = nextPowerOfTwo;
exports.calculateRounds = calculateRounds;
// Tournament Utility Functions
function generateTournamentCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
function generatePlayerAlias() {
    const adjectives = ['Quick', 'Swift', 'Bold', 'Brave', 'Fierce', 'Smart', 'Epic', 'Wild', 'Cool', 'Pro'];
    const nouns = ['Tiger', 'Dragon', 'Eagle', 'Wolf', 'Falcon', 'Lion', 'Bear', 'Hawk', 'Fox', 'Shark'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 100);
    return `${adj}${noun}${num}`;
}
function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}
function nextPowerOfTwo(n) {
    let power = 1;
    while (power < n) {
        power *= 2;
    }
    return power;
}
function calculateRounds(capacity) {
    return Math.log2(capacity);
}
