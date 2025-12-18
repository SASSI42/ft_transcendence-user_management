'use strict'

const fp = require('fastify-plugin');
const crypto = require('crypto');

module.exports = fp(async function pass_generator(fastify, opts) {
    
    function generateSecurePassword(minLength, maxLength) {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';

        const special = '#@';

        const allChars = upper + lower + numbers + special;

        const lengthRange = maxLength - minLength + 1;
        const randomLength = minLength + crypto.randomInt(lengthRange);

        let passwordChars = [
            upper[crypto.randomInt(upper.length)],
            lower[crypto.randomInt(lower.length)],
            numbers[crypto.randomInt(numbers.length)],
            special[crypto.randomInt(special.length)],
        ];

        const remainingLength = randomLength - passwordChars.length;
        const randomBytes = crypto.randomBytes(remainingLength);

        for (let i = 0; i < remainingLength; i++) {
            const index = randomBytes[i] % allChars.length;
            passwordChars.push(allChars[index]);
        }

        for (let i = passwordChars.length - 1; i > 0; i--) {
            const j = crypto.randomInt(i + 1);
            [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
        }

        return passwordChars.join('');
    }

    fastify.decorate('randomValGenerator', {securePassword:generateSecurePassword});
}, {
    fastify: '>=3.0.0',
    name: 'fastify-password-generator'
});


