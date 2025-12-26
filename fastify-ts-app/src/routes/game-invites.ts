import { FastifyInstance } from 'fastify';
import { GameInvitesService } from '../services/GameInvitesService';

export async function gameInvitesRoutes(fastify: FastifyInstance) {
    // Send game invite (REST fallback, primarily via Socket.IO)


    // Get pending invites (received)
    fastify.get('/game-invites/pending/:userId', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: number };
            const invites = GameInvitesService.getPendingInvites(fastify.db, userId);
            return reply.code(200).send(invites);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get sent invites
    fastify.get('/game-invites/sent/:userId', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: number };
            const invites = GameInvitesService.getSentInvites(fastify.db,userId);
            return reply.code(200).send(invites);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get invite by ID
    // fastify.get('/game-invites/:inviteId', async (request, reply) => {
    //     try {
    //         const { inviteId } = request.params as { inviteId: string };
    //         const invite = GameInvitesService.getInviteById(inviteId);
    //         if (!invite) {
    //             return reply.code(404).send({ error: 'Invite not found' });
    //         }
    //         return reply.code(200).send(invite);
    //     } catch (error: any) {
    //         return reply.code(400).send({ error: error.message });
    //     }
    // });

    // Get invite history
    // fastify.get('/game-invites/history/:userId', async (request, reply) => {
    //     try {
    //         const { userId } = request.params as { userId: string };
    //         const { limit } = request.query as { limit?: string };
    //         const history = GameInvitesService.getInviteHistory(
    //             userId,
    //             limit ? parseInt(limit) : 50
    //         );
    //         return reply.code(200).send(history);
    //     } catch (error: any) {
    //         return reply.code(400).send({ error: error.message });
    //     }
    // });

    // Cleanup expired invites
    // fastify.post('/game-invites/cleanup', async (request, reply) => {
    //     try {
    //         const result = GameInvitesService.cleanupExpiredInvites();
    //         return reply.code(200).send(result);
    //     } catch (error: any) {
    //         return reply.code(400).send({ error: error.message });
    //     }
    // });
}