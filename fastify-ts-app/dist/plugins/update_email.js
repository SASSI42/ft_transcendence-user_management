"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function update_email(fastify, opts) {
    fastify.route({
        method: "PUT",
        url: '/api/user/update_email',
        handler: async function update_mail(request, reply) {
            const auth = request.headers.authorization;
            if (!auth || !auth.startsWith('Bearer ')) {
                return reply.code(401).send({
                    success: false,
                    message: "Unauthorized: Token is missing or invalid format"
                });
            }
            try {
                const jwt_token = auth.substring(7);
                const verify_t = await fastify.jwtUtil.verifyToken(jwt_token);
                if (!verify_t) {
                    return reply.code(404).send({
                        success: false,
                        message: "Unauthorized: Invalid format or expired token"
                    });
                }
                const { newAddress, password } = request.body || {};
                const get_User = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(newAddress);
                if (get_User) {
                    return reply.code(404).send({
                        success: false,
                        message: "this address already in use"
                    });
                }
                const user = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token);
                if (!user) {
                    return reply.code(404).send({
                        success: false,
                        message: "Token is expired sign in again"
                    });
                }
                if (newAddress === user.email) {
                    return reply.code(404).send({
                        success: false,
                        message: "use a diffrent email address"
                    });
                }
                const isMatch = await fastify.crypt_pass.verify_pass(user.password, password, user.salt);
                if (!isMatch) {
                    return reply.code(404).send({
                        success: false,
                        message: "Incorrect password"
                    });
                }
                fastify.db.prepare("UPDATE users SET email = ? WHERE token = ?").run(newAddress, jwt_token);
                return reply.code(200).send({
                    success: true,
                    message: "The address changed successfuly."
                });
            }
            catch (error) {
                return reply.code(500).send({
                    success: false,
                    message: "Internel server error."
                });
            }
        }
    });
}
exports.default = (0, fastify_plugin_1.default)(update_email, {
    name: 'update_email'
});
