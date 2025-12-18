'use strict'

const fp = require('fastify-plugin');
const crypto = require('crypto');
const fastify = require('fastify');

module.exports = fp (async function encryption(fastify, opts){
    async function getSalt(){
        return(crypto.randomBytes(16).toString("hex"));
    }

    async function getHash(password, salt){
        return (crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256')).toString('hex');
    }

    async function verify_pass(hashPassword, password, salt){
        const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
        return(newHash === hashPassword);
    }
    fastify.decorate("crypt_pass", {
        getSalt: getSalt,
        getHash: getHash,
        verify_pass: verify_pass
    });
},{
    name: 'crypt'
})