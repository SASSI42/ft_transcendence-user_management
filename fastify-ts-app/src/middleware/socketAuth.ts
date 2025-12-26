import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';

// 1. Export the type so handlers.ts can import it
export interface AuthenticatedSocket extends Socket {
    data: {
        user: {
            id: number;      // Changed from string to number (to match User Mgmt)
            username: string;
        };
    };
}

// 2. Export the middleware function
export const socketAuthMiddleware = (fastify: FastifyInstance) => {
    return (socket: Socket, next: (err?: Error) => void) => {
        try {
            // Get token from the client handshake
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify using Fastify's JWT instance
            // (We assume your token payload has 'sub' as id and 'name' as username)
            const decoded: any = fastify.jwt.verify(token);

            // Attach user data to the socket
            socket.data.user = {
                id: decoded.sub || decoded.id,
                username: decoded.name || decoded.username
            };

            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    };
};