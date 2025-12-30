"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function update_password(fastify, opts) {
    fastify.route({
        method: "PUT",
        url: '/api/user/update_password',
        handler: async function update_pass(request, reply) {
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
                const { oldPassword, newPassword } = request.body || {};
                if (oldPassword === newPassword) {
                    return reply.code(404).send({
                        success: false,
                        message: "The new password must be diffrent with the old password"
                    });
                }
                const getUser = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token);
                if (!getUser) {
                    return reply.code(404).send({
                        success: false,
                        message: "Token is expired sign in again"
                    });
                }
                const isMatches = await fastify.crypt_pass.verify_pass(getUser.password, oldPassword, getUser.salt);
                if (!isMatches) {
                    return reply.code(404).send({
                        success: false,
                        message: "Incorrect password."
                    });
                }
                const hash_pass = await fastify.crypt_pass.getHash(newPassword, getUser.salt);
                const stm = fastify.db.prepare("UPDATE users SET password = ? WHERE token = ?").run(hash_pass, jwt_token);
                return reply.code(201).send({
                    success: true,
                    message: "The password has been changed successfulty."
                });
            }
            catch (error) {
                return reply.code(500).send({
                    success: false,
                    message: "Internel server error: " + error
                });
            }
        }
    });
}
exports.default = (0, fastify_plugin_1.default)(update_password, {
    name: "update_pass"
});
