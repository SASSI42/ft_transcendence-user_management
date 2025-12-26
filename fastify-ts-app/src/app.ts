import Fastify from 'fastify'
import jwt from '@fastify/jwt';
import cors from '@fastify/cors'
import { Server } from 'socket.io';

import myPlugin from './plugins/plugin'
import data_base from './plugins/data_base'
import signIN from './plugins/signIn'
import signUP from './plugins/signUp'
import encryption from './plugins/hasher'
import jwt_plugin from './plugins/jwt_plugin'
import update_username from './plugins/update_username'
import update_password from './plugins/update_password'
import update_email from './plugins/update_email'

import { setupSocketHandlers } from './socket/handlers';
import { friendsRoutes } from './routes/friends';
import { messagesRoutes } from './routes/messages';
import { gameInvitesRoutes } from './routes/game-invites';
import { GameInvitesService } from './services/GameInvitesService';
import { authMiddleware } from './middleware/auth';
import { socketAuthMiddleware } from './middleware/socketAuth';

const server = Fastify({
  logger: true
})

const start = async () => {
  try {
    await server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        // allowedHeaders: ['content-Type', 'Authorization']
    })
    await server.register(jwt, {secret: 'Super_secret_for_jwt'})
    await server.register(jwt_plugin)
    await server.register(data_base)
    await server.register(myPlugin)
    await server.register(signUP)
    await server.register(update_password)
    await server.register(update_username)
    await server.register(update_email)
    await server.register(signIN)
    await server.register(encryption)
    // await server.listen({ port: 3000})
    // 3. Chat Routes (Protected)
    server.register(async (protectedApi) => {
        // Protect all these routes with JWT
        protectedApi.addHook('onRequest', authMiddleware);

        protectedApi.register(friendsRoutes, { prefix: '/api' });
        protectedApi.register(messagesRoutes, { prefix: '/api' });
        protectedApi.register(gameInvitesRoutes, { prefix: '/api' });
    });

    // 4. Start Server
    await server.ready(); // Wait for plugins
    server.server.listen(3000, () => {
        console.log('🚀 Server running on port 3000');
    });

    // 5. Setup Socket.IO
    const io = new Server(server.server, {
        cors: {
            origin: true, // Allow frontend
            credentials: true
        }
    });

    // Use JWT for Socket Auth
    io.use(socketAuthMiddleware(server)); // Pass fastify instance to access jwt verify
    
    setupSocketHandlers(server.db, io);
  }catch (err){
    server.log.error(err)
    process.exit(1)
  }
}

start()
