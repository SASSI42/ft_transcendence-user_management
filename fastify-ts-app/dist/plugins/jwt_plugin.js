"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const server = (0, fastify_1.default)();
server.register(jwt_1.default, {
    secret: "Super_sucret_for_jwt"
});
const jwtPlugin = async (fastify) => {
    async function getToken(payload) {
        return (fastify.jwt.sign(payload));
    }
    async function verifyToken(token) {
        return (fastify.jwt.verify(token));
    }
    fastify.decorate('jwtUtil', {
        getToken,
        verifyToken,
    });
};
exports.default = (0, fastify_plugin_1.default)(jwtPlugin, {
    name: "jwtPlugin",
    dependencies: ['@fastify/jwt']
});
