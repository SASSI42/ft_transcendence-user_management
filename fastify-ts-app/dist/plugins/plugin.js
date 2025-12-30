"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const myPlugin = async (fastify, opts) => {
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
exports.default = (0, fastify_plugin_1.default)(myPlugin);
