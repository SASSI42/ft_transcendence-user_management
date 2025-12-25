import Fastify,{ FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fp from 'fastify-plugin'

type signInBody = {
	email: string,
	password: string
}

type User_type = {
	username:string,
	email:string,
	password:string,
	salt:string,
	id:number
}

async function signIN(fastify:FastifyInstance, opts:FastifyPluginOptions) {
	fastify.route<{Body:signInBody}>(
	{    
		method:"POST",
		url:'/api/user/signIn',
		schema :{
			body : fastify.getSchema('schema:user:create:signin:body'),
			response:{
				200: fastify.getSchema('schema:user:create:response'),
			}
		},
		handler: async function signIn(request:FastifyRequest<{Body:signInBody}>, reply:FastifyReply) {
			const {email, password} = request.body || {};
			if (!password || !email)
			{
				return reply.code(400).send({
					success: false,
					message: "empty field."
				})
			}
			const normalizedEmail = email.toLowerCase();
			const user = (fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail)) as User_type | undefined;
			if (!user)
			{
				return reply.code(400).send({
					success:false,
					message:"This account is not registered."
				})
			}
			let isMatch:boolean = await fastify.crypt_pass.verify_pass(user.password, password, user.salt)
			if (isMatch === false)
			{
				return reply.code(401).send({
					success:false,
					message: "Incorrect password."
				})
			}
			try{
				const newToken = await fastify.jwtUtil.getToken({
					"sub":user.id,
					"name":user.username,
					"logger":true,
					"iat":Math.floor(Date.now()/1000)
				})
				fastify.db.prepare("UPDATE users SET token = ? WHERE email = ?").run(newToken, normalizedEmail);
				return(reply.code(200).send({
					"status":true,
					"success":true,
					"message":"Signed-in successfuly.",
					"user":{
						"id":user.id,
						"username":user.username,
						"email":normalizedEmail
					},
					"jwt":newToken
				}))
			}catch(error)
			{
				request.log.error(error);
				return reply.code(500).send({
					success:false,
					message:"Internel server error."
				})
			}
		}
	})
}
export default fp(signIN, {
	name:'signin'
})