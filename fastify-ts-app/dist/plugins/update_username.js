"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function update_username(fastify, opts) {
    fastify.route({
        method: "PUT",
        url: '/api/user/update_username',
        handler: async function update_name(request, reply) {
            const auth = request.headers.authorization;
            if (!auth || !auth.startsWith('Bearer ')) {
                return reply.code(401).send({
                    success: false,
                    message: "Unauthrized: Token is missing or invalid format"
                });
            }
            try {
                const jwt_token = auth.substring(7);
                const verify_t = await fastify.jwtUtil.verifyToken(jwt_token);
                if (!verify_t) {
                    return reply.code(404).send({
                        success: false,
                        message: "Unauthorized: Invalid format or expired token."
                    });
                }
                const { newName, password } = request.body || {};
                const get_name = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(newName);
                if (get_name) {
                    return reply.code(404).send({
                        success: false,
                        message: "This name aleady in use."
                    });
                }
                const get_user = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token);
                if (!get_user) {
                    return reply.code(404).send({
                        success: false,
                        message: "Token is expired sign in again."
                    });
                }
                if (newName === get_user.username) {
                    return reply.code(404).send({
                        success: false,
                        message: "use a diffrent Name"
                    });
                }
                const isMatch = await fastify.crypt_pass.verify_pass(get_user.password, password, get_user.salt);
                if (!isMatch) {
                    return reply.code(404).send({
                        success: false,
                        message: "Incorrect password"
                    });
                }
                fastify.db.prepare("UPDATE users SET username = ? WHERE token = ?").run(newName, jwt_token);
                return reply.code(200).send({
                    success: true,
                    message: "The username changed successfuly."
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
exports.default = (0, fastify_plugin_1.default)(update_username, {
    name: 'update_username'
});
