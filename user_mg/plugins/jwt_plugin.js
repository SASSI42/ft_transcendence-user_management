'use strict'

const fp = require('fastify-plugin');

module.exports = fp(async function jwtHandler(fastify, opts){
    fastify.register(require('@fastify/jwt'), {
        secret: "Super_sucret_for_jwt"
    });
    async function genJwtToken(payload){
        return(fastify.jwt.sign(payload));}
    async function verifyToken(token){
        return (fastify.jwt.verify(token))}
    fastify.decorate("jwtd", {gentoken: genJwtToken,verifyToken: verifyToken})
},{
    name: "jwt_plugin"
})