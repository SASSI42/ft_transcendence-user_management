import { FastifyRequest, FastifyReply } from 'fastify';

// Augment FastifyRequest to include user info
declare module 'fastify' {
    interface FastifyRequest {
        users: {
            id: number; // User Management uses numbers
            username: string;
        };
    }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    try {
        // This automatically checks the 'Authorization: Bearer <token>' header
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
}