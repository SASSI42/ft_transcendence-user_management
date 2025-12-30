"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cors_1 = __importDefault(require("@fastify/cors"));
const socket_io_1 = require("socket.io");
const plugin_1 = __importDefault(require("./plugins/plugin"));
const data_base_1 = __importDefault(require("./plugins/data_base"));
const signIn_1 = __importDefault(require("./plugins/signIn"));
const signUp_1 = __importDefault(require("./plugins/signUp"));
const hasher_1 = __importDefault(require("./plugins/hasher"));
const jwt_plugin_1 = __importDefault(require("./plugins/jwt_plugin"));
const update_username_1 = __importDefault(require("./plugins/update_username"));
const update_password_1 = __importDefault(require("./plugins/update_password"));
const update_email_1 = __importDefault(require("./plugins/update_email"));
const handlers_1 = require("./socket/handlers");
const friends_1 = require("./routes/friends");
const messages_1 = require("./routes/messages");
const game_invites_1 = require("./routes/game-invites");
const auth_1 = require("./middleware/auth");
const socketAuth_1 = require("./middleware/socketAuth");
const server = (0, fastify_1.default)({
    logger: true
});
const start = async () => {
    try {
        await server.register(cors_1.default, {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
            // allowedHeaders: ['content-Type', 'Authorization']
        });
        await server.register(jwt_1.default, { secret: 'Super_secret_for_jwt' });
        await server.register(jwt_plugin_1.default);
        await server.register(data_base_1.default);
        await server.register(plugin_1.default);
        await server.register(signUp_1.default);
        await server.register(update_password_1.default);
        await server.register(update_username_1.default);
        await server.register(update_email_1.default);
        await server.register(signIn_1.default);
        await server.register(hasher_1.default);
        // await server.listen({ port: 3000})
        // 3. Chat Routes (Protected)
        server.register(async (protectedApi) => {
            // Protect all these routes with JWT
            protectedApi.addHook('onRequest', auth_1.authMiddleware);
            protectedApi.register(friends_1.friendsRoutes, { prefix: '/api' });
            protectedApi.register(messages_1.messagesRoutes, { prefix: '/api' });
            protectedApi.register(game_invites_1.gameInvitesRoutes, { prefix: '/api' });
        });
        // 4. Start Server
        await server.ready(); // Wait for plugins
        server.server.listen({ port: 3000, host: '0.0.0.0' }, () => {
            // if (err) {
            //       server.log.error(err);
            //       process.exit(1);
            //   }
            console.log(`🚀 Server running on port 3000`);
        });
        // 5. Setup Socket.IO
        const io = new socket_io_1.Server(server.server, {
            cors: {
                origin: true, // Allow frontend
                credentials: true
            }
        });
        // Use JWT for Socket Auth
        io.use((0, socketAuth_1.socketAuthMiddleware)(server)); // Pass fastify instance to access jwt verify
        (0, handlers_1.setupSocketHandlers)(server.db, io);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
