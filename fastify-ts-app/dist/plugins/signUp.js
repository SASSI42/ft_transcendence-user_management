"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
async function signUP(fastify, opts) {
    fastify.route({
        method: "POST",
        url: '/api/user/signUp',
        schema: {
            body: fastify.getSchema('schema:user:create:body'),
            response: {
                201: fastify.getSchema('schema:user:create:response'),
            }
        },
        handler: async function createAccount(request, reply) {
            const { username, email, password } = request.body || {};
            if (!username || !email || !password)
                return reply.code(401).send({
                    success: false,
                    message: "empty field"
                });
            const normalizedEmail = email.toLocaleLowerCase();
            const usedEmail = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
            if (usedEmail) {
                return (reply.code(409).send({
                    success: false,
                    message: "The email address already in use."
                }));
            }
            const usedUsername = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
            if (usedUsername) {
                return (reply.code(409).send({
                    success: false,
                    message: "The username already in use."
                }));
            }
            try {
                const salt = await fastify.crypt_pass.getSalt();
                const hashedPassword = await fastify.crypt_pass.getHash(password, salt);
                const insert = fastify.db.prepare("INSERT INTO users (username, password, email, salt, token, status) VALUES (?, ?, ?, ?, ?, ?)").run(username, hashedPassword, normalizedEmail, salt, null, 1);
                const token = await fastify.jwtUtil.getToken({
                    "sub": insert.lastInsertRowid,
                    "name": username,
                    "logger": true,
                    "iat": Math.floor(Date.now() / 1000)
                });
                const user = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
                if (!user) {
                    return reply.code(409).send({
                        success: false,
                        message: "The account not created."
                    });
                }
                const update = fastify.db.prepare("UPDATE users SET token = ? WHERE id = ?").run(token, insert.lastInsertRowid);
                if (!update) {
                    return reply.code(401).send({
                        success: false,
                        message: "The account not created"
                    });
                }
                return reply.code(201).send({
                    status: true,
                    success: true,
                    message: "Signed-up successfuly.",
                    user: {
                        id: insert.lastInsertRowid,
                        username: username,
                        email: normalizedEmail,
                    },
                    jwt: token
                });
            }
            catch (error) {
                request.log.error(error);
                return reply.code(500).send({
                    status: false,
                    message: "Internal server error" + error
                });
            }
        }
    });
}
exports.default = (0, fastify_plugin_1.default)(signUP, {
    name: 'signup'
});
