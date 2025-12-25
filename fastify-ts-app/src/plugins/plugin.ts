import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'

const myPlugin: FastifyPluginAsync = async (fastify, opts) => {
    fastify.addSchema(require('../../schemas/list-query.json'));
    fastify.addSchema(require('../../schemas/create-body.json'));
    fastify.addSchema(require('../../schemas/create-response.json'));
    fastify.addSchema(require('../../schemas/status-params.json'));
    fastify.addSchema(require('../../schemas/create-signin-body.json'));
    fastify.addSchema(require('../../schemas/list-users-headers.json'));
    fastify.addSchema(require('../../schemas/list_users_response.json'));

    fastify.decorate('myUtility', () => {
        return `hello from the plugin with option`;
    });

    fastify.get('/plugin-route', async () => {
        return { status: 'ok' };
    });
};

export default fp(myPlugin);