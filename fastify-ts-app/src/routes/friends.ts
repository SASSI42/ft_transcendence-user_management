import { FastifyInstance, FastifyRequest} from 'fastify';
import { FriendsService } from '../services/FriendsService';
// import   FastifyJWT  from '../types/fastify-jwt';


interface UserRow {
    id: number;
    username: string;
    Avatar: string;
}

interface JwtUser {
    id: number;
    username: string;
}
export async function friendsRoutes(fastify: FastifyInstance) {
    
    // NEW: Find user by username (for Add Friend)
    fastify.get('/friends/find/:username', async (request, reply) => {
        try {
            const { username } = request.params as { username: string };

            const userToken = request.user as JwtUser; 
            const currentUserId = userToken.id;

            const user = fastify.db.prepare('SELECT id, username, Avatar FROM users WHERE username = ?').get(username) as UserRow | undefined;
            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }
            console.log(`🔍 Checking Relation: Me [${currentUserId}](${username}) vs Them [${user.id}]`);
            // 2. 🛠️ FIX: Check for existing relationship
            const friendship = fastify.db.prepare(`
                SELECT user_id, status FROM friendships 
                WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
            `).get(currentUserId, user.id, user.id, currentUserId) as any;

            console.log("🔍 Friendship Check:", friendship); // <--- ADD THIS
            let relation = 'none';
            if (friendship) {
                if (friendship.status === 'accepted') {
                    relation = 'friends';
                } else if (friendship.status === 'pending') {
                    // Check who sent the request
                    // If user_id == currentUserId, I sent it ('pending_sent')
                    // If user_id != currentUserId, They sent it ('pending_received')
                    relation = (friendship.user_id === currentUserId) ? 'pending_sent' : 'pending_received';
                }
            }

            // Return user info + relation status
            return reply.code(200).send({ ...user, relation });

        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });



    // Get friends list
    fastify.get('/friends/:userId', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const friends = FriendsService.getFriends(fastify.db, Number(userId));
            return reply.code(200).send(friends);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get pending friend requests
    fastify.get('/friends/:userId/pending', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const requests = FriendsService.getPendingRequests(fastify.db, Number(userId));
            return reply.code(200).send(requests);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get sent friend requests
    fastify.get('/friends/:userId/sent', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const requests = FriendsService.getSentRequests(fastify.db, Number(userId));
            return reply.code(200).send(requests);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Get blocked users
    fastify.get('/friends/:userId/blocked', async (request, reply) => {
        try {
            const { userId } = request.params as { userId: string };
            const blocked = FriendsService.getBlockedUsers(fastify.db, Number(userId));
            return reply.code(200).send(blocked);
        } catch (error: any) {
            return reply.code(400).send({ error: error.message });
        }
    });

    // Check if users are friends
    // fastify.get('/friends/check/:userId/:friendId', async (request, reply) => {
    //     try {
    //         const { userId, friendId } = request.params as { userId: string; friendId: string };
    //         const areFriends = FriendsService.areFriends(userId, friendId);
    //         return reply.code(200).send({ areFriends });
    //     } catch (error: any) {
    //         return reply.code(400).send({ error: error.message });
    //     }
    // });
}