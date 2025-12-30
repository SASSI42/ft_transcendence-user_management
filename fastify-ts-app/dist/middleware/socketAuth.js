"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = void 0;
// 2. Export the middleware function
const socketAuthMiddleware = (fastify) => {
    return (socket, next) => {
        try {
            // Get token from the client handshake
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            // Verify using Fastify's JWT instance
            // (We assume your token payload has 'sub' as id and 'name' as username)
            const decoded = fastify.jwt.verify(token);
            // Attach user data to the socket
            socket.data.user = {
                id: decoded.sub || decoded.id,
                username: decoded.name || decoded.username
            };
            next();
        }
        catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    };
};
exports.socketAuthMiddleware = socketAuthMiddleware;
