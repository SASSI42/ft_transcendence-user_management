import Fastify,{ FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply, FastifyPluginAsync, fastify } from "fastify"
import fp from 'fastify-plugin'

type Header_type = {
    authorization:string
}

type body_type = {
    password:string,
    newAddress:string
}

type User_type = {
    password: string,
    salt: string,
    email: string
}

async function update_email(fastify:FastifyInstance, opts:FastifyPluginOptions)
{
    fastify.route<{Headers:Header_type, Body:body_type}>({
        method: "PUT",
        url: '/api/user/update_email',
        handler: async function update_mail(request:FastifyRequest<{Headers:Header_type, Body:body_type}>, reply:FastifyReply){
            const auth = request.headers.authorization;
            if (!auth || !auth.startsWith('Bearer '))
            {
                return reply.code(401).send({
                    success: false,
                    message: "Unauthorized: Token is missing or invalid format"
                })
            }
            try{
                const jwt_token = auth.substring(7);
                const verify_t = await fastify.jwtUtil.verifyToken(jwt_token);
                if (!verify_t)
                {
                    return reply.code(404).send({
                        success: false,
                        message: "Unauthorized: Invalid format or expired token"
                    })
                }
                const {newAddress, password} = request.body || {};
                const get_User = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(newAddress);
                if (get_User)
                {
                    return reply.code(404).send(
                        {
                            success: false,
                            message: "this address already in use"
                        }
                    )
                }
                const user = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token) as User_type | undefined;
                if (!user)
                {
                    return reply.code(404).send({
                        success:false,
                        message: "Token is expired sign in again"
                    })
                }
                if (newAddress === user.email)
                {
                    return reply.code(404).send({
                        success: false,
                        message: "use a diffrent email address"
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
                fastify.db.prepare("UPDATE users SET email = ? WHERE token = ?").run(newAddress, jwt_token);
                return reply.code(200).send({
                    success:true,
                    message: "The address changed successfuly."
                })

            }catch(error)
            {
                return reply.code(500).send({
                    success:false,
                    message :"Internel server error."
                })
            }
        }
    })
}

export default fp(update_email, {
    name:'update_email'
})