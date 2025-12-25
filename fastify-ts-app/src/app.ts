import Fastify from 'fastify'
import myPlugin from './plugins/plugin'
import data_base from './plugins/data_base'
import signIN from './plugins/signIn'
import signUP from './plugins/signUp'
import encryption from './plugins/hasher'
import jwt from '@fastify/jwt';
import jwt_plugin from './plugins/jwt_plugin'
import cors from '@fastify/cors'
import update_username from './plugins/update_username'
import update_password from './plugins/update_password'
import update_email from './plugins/update_email'

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
    await server.listen({ port: 3000})
  }catch (err){
    server.log.error(err)
    process.exit(1)
  }
}

start()
