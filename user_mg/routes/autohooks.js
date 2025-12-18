'use strict'

const fp = require('fastify-plugin');
const {zod} =require('zod');

module.exports = fp(async function userSchemas(fastify, opts)
{
    fastify.addSchema(require('./schemas/list-query.json'));
    fastify.addSchema(require('./schemas/create-body.json'));
    fastify.addSchema(require('./schemas/create-response.json'));
    fastify.addSchema(require('./schemas/status-params.json'));
    fastify.addSchema(require('./schemas/create-signin-body.json'));
    fastify.addSchema(require('./schemas/list-users-headers.json'));
    fastify.addSchema(require('./schemas/list_users_response.json'));
}, {
    name: "schemas"
});