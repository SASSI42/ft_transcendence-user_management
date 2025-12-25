import Fastify,{ FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply, FastifyPluginAsync, fastify } from "fastify"
import fp, { fastifyPlugin } from 'fastify-plugin'
import jwt from '@fastify/jwt'

const server = Fastify();

server.register(jwt, {
    secret: "Super_sucret_for_jwt"
})

const jwtPlugin:FastifyPluginAsync = async (fastify)=>{

    async function getToken(payload:object)
    {
        return(fastify.jwt.sign(payload))
    }

    async function verifyToken(token:string)
    {
        return(fastify.jwt.verify(token))
    }
    fastify.decorate('jwtUtil', {
        getToken,
        verifyToken,
    })
}

export default fp(jwtPlugin, {
    name: "jwtPlugin",
    dependencies: ['@fastify/jwt']
})