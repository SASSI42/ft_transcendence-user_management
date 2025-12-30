"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesRoutes = messagesRoutes;
const MessagesService_1 = require("../services/MessagesService");
async function messagesRoutes(fastify) {
    // Get message history between two users
    fastify.get('/messages/history/:userId1/:userId2', async (request, reply) => {
        try {
            const { userId1, userId2 } = request.params;
            const { limit, offset } = request.query;
            const history = MessagesService_1.MessagesService.getMessageHistory(fastify.db, userId1, userId2, limit ? parseInt(limit) : 50, offset ? parseInt(offset) : 0);
            return reply.code(200).send(history);
        }
        catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });
    // Mark message as read
    fastify.put('/messages/read/:messageId', async (request, reply) => {
        try {
            const { messageId } = request.params;
            const { userId } = request.body;
            const result = MessagesService_1.MessagesService.markAsRead(fastify.db, messageId, userId);
            return reply.code(200).send(result);
        }
        catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });
    // Get unread message count
    fastify.get('/messages/unread-count/:userId', async (request, reply) => {
        try {
            const { userId } = request.params;
            const count = MessagesService_1.MessagesService.getUnreadCount(fastify.db, userId);
            return reply.code(200).send({ count });
        }
        catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });
    // Get unread messages grouped by sender
    fastify.get('/messages/unread/:userId', async (request, reply) => {
        try {
            const { userId } = request.params;
            const unreadMessages = MessagesService_1.MessagesService.getUnreadMessagesBySender(fastify.db, userId);
            return reply.code(200).send(unreadMessages);
        }
        catch (error) {
            return reply.code(400).send({ error: error.message });
        }
    });
}
