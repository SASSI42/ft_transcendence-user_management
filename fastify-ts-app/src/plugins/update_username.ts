import Fastify,{ FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fp from 'fastify-plugin'
import { request } from "http"

type Header_type = {
    authorization:string
}

type body_type = {
    newName:string,
    password:string
}

type User_type = {
    password: string,
    username:string,
    salt: string
}

async function update_username(fastify:FastifyInstance, opts:FastifyPluginOptions)
{
    fastify.route<{Body:body_type, Headers:Header_type}>({
        method: "PUT",
        url:'/api/user/update_username',
        handler: async function update_name(request:FastifyRequest<{Headers:Header_type, Body:body_type}>, reply:FastifyReply){
            const auth = request.headers.authorization;
            if (!auth || !auth.startsWith('Bearer '))
            {
                return reply.code(401).send({
                    success:false,
                    message: "Unauthrized: Token is missing or invalid format"
                })
            }
            try{
                const jwt_token = auth.substring(7);
                const verify_t = await fastify.jwtUtil.verifyToken(jwt_token);
                if (!verify_t)
                {
                    return reply.code(404).send({
                        success: false,
                        message: "Unauthorized: Invalid format or expired token."
                    })
                }
                const {newName, password} = request.body || {};
                const get_name = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(newName);
                if (get_name)
                {
                    return reply.code(404).send({
                        success:false,
                        message: "This name aleady in use."
                    })
                }
                const get_user = fastify.db.prepare("SELECT * FROM users WHERE token = ?").get(jwt_token) as User_type | undefined;
                if (!get_user)
                {
                    return reply.code(404).send({
                        success: false,
                        message: "Token is expired sign in again."
                    })
                }
                if (newName === get_user.username)
                {
                    return reply.code(404).send({
                        success: false,
                        message: "use a diffrent Name"
                    })
                }
                const isMatch = await fastify.crypt_pass.verify_pass(get_user.password, password, get_user.salt);
                if (!isMatch)
                {
                    return reply.code(404).send(
                        {
                            success: false,
                            message: "Incorrect password"
                        }
                    )
                }
                fastify.db.prepare("UPDATE users SET username = ? WHERE token = ?").run(newName, jwt_token);
                return reply.code(200).send({
                    success:true,
                    message: "The username changed successfuly."
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

export default fp(update_username, {
    name: 'update_username'
})