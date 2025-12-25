import Fastify,{ FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply, FastifyPluginAsync, fastify } from "fastify"
import fp from 'fastify-plugin'
import multipart from "@fastify/multipart"


type Header_type = {
    authorization:string
}

type body_type = {
    password:string,
}

type Route_type = {
    Headers: Header_type,
    Body: body_type
}

type User_type = {
    password: string,
    salt: string,
    email: string
}

async function update_avatar(fastify:FastifyInstance, opts:FastifyPluginOptions)
{
    fastify.register(multipart);
    fastify.route<Route_type>({
        method: "POST",
        url: '/api/user/update_avatar',
        handler: async function update_profile(request:FastifyRequest<Route_type>, reply:FastifyReply){
            const auth = request.headers.authorization;
            if (!auth || !auth.startsWith('Bearer '))
            {
                return reply.code(401).send({
                    success: false,
                    message: "unauthorized :token missing or invalid format"
                })
            }
            try{
                const jwt_token = auth.substring(7);
                const verify = await fastify.jwtUtil.verifyToken(jwt_token);
                if (!verify){
                    return reply.code(404).send({
                        success: false,
                        message :"Unauthorized: Invalid or expired token"
                    })
                }
                const {password} = request.body || {};
                const user = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token) as User_type | undefined;
                if (!user)
                {
                    return reply.code(404).send({
                        success:false,
                        message: "Token is expired sign in again"
                    })
                }
                const isMatch = await fastify.crypt_pass.verify_pass(user.password, password, user.salt);
                if (!isMatch)
                {
                    return reply.code(404).send(
                        {
                            success: false,
                            message: "Incorrect password"
                        }
                    )
                }

        }catch(error)
        {

        }
        }
    })
}

export default fp(update_avatar, {
    name:'update_avatar'
})