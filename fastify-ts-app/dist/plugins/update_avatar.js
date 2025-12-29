"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
async function update_avatar(fastify, opts) {
    fastify.register(multipart_1.default);
    fastify.route({
        method: "POST",
        url: '/api/user/update_avatar',
        handler: async function update_profile(request, reply) {
            const auth = request.headers.authorization;
            if (!auth || !auth.startsWith('Bearer ')) {
                return reply.code(401).send({
                    success: false,
                    message: "unauthorized :token missing or invalid format"
                });
            }
            try {
                const jwt_token = auth.substring(7);
                const verify = await fastify.jwtUtil.verifyToken(jwt_token);
                if (!verify) {
                    return reply.code(404).send({
                        success: false,
                        message: "Unauthorized: Invalid or expired token"
                    });
                }
                const { password } = request.body || {};
                const user = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token);
                if (!user) {
                    return reply.code(404).send({
                        success: false,
                        message: "Token is expired sign in again"
                    });
                }
                const isMatch = await fastify.crypt_pass.verify_pass(user.password, password, user.salt);
                if (!isMatch) {
                    return reply.code(404).send({
                        success: false,
                        message: "Incorrect password"
                    });
                }
            }
            catch (error) {
            }
        }
    });
}
exports.default = (0, fastify_plugin_1.default)(update_avatar, {
    name: 'update_avatar'
});
