import { FastifyInstance } from 'fastify';
import { MessagesService } from '../services/MessagesService';

export async function messagesRoutes(fastify: FastifyInstance) {

    // Get message history between two users
    fastify.get('/messages/history/:userId1/:userId2', async (request, reply) => {
        try {
            const { userId1, userId2 } = request.params as { userId1: number; userId2: number };
            const { limit, offset } = request.query as { limit?: string; offset?: string };
            
            const history = MessagesService.getMessageHistory(
                fastify.db,
                userId1,
                userId2,
                limit ? parseInt(limit) : 50,
                offset ? parseInt(offset) : 0
            );
            return reply.code(200).send(history);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Mark message as read
    fastify.put('/messages/read/:messageId', async (request, reply) => {
        try {
            const { messageId } = request.params as { messageId: string };
            const { userId } = request.body as { userId: number };
            const result = MessagesService.markAsRead(fastify.db,messageId, userId);
            return reply.code(200).send(result);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get unread message count
    fastify.get('/messages/unread-count/:userId', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: number };
            const count = MessagesService.getUnreadCount(fastify.db,userId);
            return reply.code(200).send({ count });
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get unread messages grouped by sender
    fastify.get('/messages/unread/:userId', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: number };
            const unreadMessages = MessagesService.getUnreadMessagesBySender(fastify.db, userId);
            return reply.code(200).send(unreadMessages);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });


}