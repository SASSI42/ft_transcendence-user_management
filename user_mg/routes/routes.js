'use strict'
const { pipeline } = require('node:stream/promises');
const { createWriteStream } = require('node:fs');
const path = require('node:path');
const { httpErrors } = require('@fastify/sensible');
const fastify = require('fastify')();

module.exports = async function userRoutes (fastify, _opts) {
	const db = fastify.db;
	const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

	fastify.register(require('@fastify/sensible'));
	 
	fastify.get('/login/google/callback', async function (request, reply) {
		try{
		const {token} = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		request.log.info('Access Token:', token.access_token);
  
		const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		  headers: { Authorization: `Bearer ${token.access_token}` }
		});
		const d = await res.json();
		const {email, given_name, picture} = d;
		console.log(d);
		let user = db.prepare("INSERT INTO users (username, email, avatar) VALUES (?, ?, ?)").run(given_name, email, picture);
		if (!user)
		{
			return reply.code().send({
				success: false,
				message: "The user not exists."
			})
		}
		const jwtToken = await fastify.jwtd.gentoken({
			"sub":user.id,
			"name":given_name,
			"logger":true,
			"iat":Math.floor(Date.now() / 1000)
		})
		const update = db.prepare("UPDATE users SET token=? WHERE email=?").run(jwtToken,email);
		// return  reply.redirect('http://localhost:5173');
		return reply.redirect('http://localhost:5173/auth/callback/success');
		// return reply.code(200).send({
		//    success: true,
		//    message: "signed with the mail successfuly"
		// })
		}catch(err)
		{
		  return reply.code(500).send({error: "The login failed"});
		}
	 })

	fastify.route({
	method: 'POST',
	url: '/api/user/signUp',
	schema: {
		body: fastify.getSchema('schema:user:create:body'),
		response :{
			201: fastify.getSchema('schema:user:create:response'),
		}
	},
	handler: async function createAccount (request, reply) {

		const {username, password, email} = request.body || {};
		if (!username || !password || !email)
			return reply.code(401).send({
			success: false,
			message:"empty field."
		});

		const normalizedEmail = email.toLowerCase();

		const usedEmail = db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalizedEmail);
		if (usedEmail){
			return (reply.code(409).send({
				success: false,
				message:"The email address is already in use."}));
		}

		const usedUsername = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
		if (usedUsername){
			return (reply.code(409).send({
				success: false,
				message:"The username is already in use."}));
		}

		const salt = await fastify.crypt_pass.getSalt();
		const hashedPassword = await fastify.crypt_pass.getHash(password, salt);
		
		try{
			const insert = db.prepare("INSERT INTO users (username, password, email, salt, token, status) VALUES (?, ?, ?, ?, ?, ?)"
		).run(username, hashedPassword, normalizedEmail, salt, null, 1);
		const token = await fastify.jwtd.gentoken({
			"sub":insert.lastInsertRowid,
			"name":username,
			"logger":true,
			"iat": Math.floor(Date.now() / 1000)
		});
		db.prepare("UPDATE users SET token = ? WHERE id=?").run(token, insert.lastInsertRowid);
		const user = db.prepare("SELECT 1 FROM users WHERE email = ?").get(normalizedEmail);
		if (!user)
		{
			return reply.code(404).send({
				success: false,
				message: "user not found."
			})
		}
		httpErrors.notFound('user not found'); // add the http errosrs sensible///////!!!!!
		return reply.code(201).send(
			{
				status: true,
				success: true,
				message: "Signed up successfuly.",
				user:{
					id:insert.lastInsertRowid,      
					username: username,
					email: normalizedEmail,
				},
				jwt:token
			}
		);
		}catch(error){
			request.log.error(error);
			return reply.code(500).send({
				status : false,
				message : "Internal server error"
			})
		}
		}
	})

	fastify.route({
		method: 'POST',
		url: '/api/user/signIn',
		schema :{
			body : fastify.getSchema('schema:user:create:signin:body'),
			response:{
				200: fastify.getSchema('schema:user:create:response'),
			}
		},
		handler: async function login(request, reply){
			const {email, password} = request.body || {};
			if (!email || !password)
				return reply.code(400).send({
					success: false,
					message:'Missing required fields'});
			const normalizedEmail = email.toLowerCase();
			const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
			if (!user)
			{
				return(reply.code(400).send({
					success: false,
					message: "This account is not registered"
				}));
			}
			const isMatch = await fastify.crypt_pass.verify_pass(user.password, password, user.salt);
			if (!isMatch)
				return (reply.code(401).send({
					success: false,
					message: "Incorrect password"
			}));
			try
			{
				const newToken = await fastify.jwtd.gentoken({
					"sub":user.id,
					"name":user.username,
					"logger":true,
					"iat": Math.floor(Date.now() / 1000)
				})
				db.prepare("UPDATE users SET token = ? WHERE email = ?").run(newToken, normalizedEmail);

				// add two fa _here

				return reply.code(200).send(
					{
						"status": true,
						"success": true,
						"message": "Signed in successfuly.",
						"user":{
							"id":user.id,
							"username": user.username,
							"email": normalizedEmail,
						},
						"jwt":newToken
					}
				);
			}catch(error)
			{
				request.log.error(error);
				return reply.code(500).send({
					status : false,
					message : "Internal server error"
				});
			}
		}
	})

	fastify.route({
		method: 'GET',
		url: '/api/user/listUsers',
		schema:{
			headers: fastify.getSchema('schema:user:headers'),
		},
		handler: async function listUsers (request, reply) {
			const header = request.headers.authorization;
			if (!header || !header.startsWith('Bearer '))
				return (reply.code(401).send("Unaouthorized: Token missing or invalid format"))

			const token = header.substring(7);
			try{
				await fastify.jwtd.verifyToken(token);
			}
			catch(err){
				return(reply.code(401).send("Unauthorized: Invalid or expired token"));
			}
			const user = db.prepare("SELECT * FROM users WHERE token = ? ").get(token);
			if (!user)
				return (reply.code(404).send({message: "Token is expired sign in again"}));
			if (user.token !== token)
				return (reply.code(401).send("Session expired. Please sign in again"));
			const allUsers = db.prepare('SELECT * FROM users').all();
			return (reply.code(200).send({listUsers: allUsers}))
		}
	})

	fastify.route({
		method: "GET",
		url: "/api/user/avatar",
		handler: async function avatar(request, reply)
		{
			const auth = request.headers.authorization;
			if (!auth || !auth.startsWith("Bearer "))
			{
				return reply.code(401).send({
					success: false,
					message: "Unaouthorized: Token missing or invalid format"
				});
			}
			const token = auth.substring(7);
			try{
			await fastify.jwtd.verifyToken(token);
			}catch(err)
			{
				return reply.code(401).send({
					message: "Unauthorized: Invalid or expired token"
				})
			}
			try
			{
				const user = db.prepare("SELECT * FROM users WHERE token = ?").get(token)
				if (!user || user.avatar)
				{
					return reply.code(404).send({
						success: false,
						message: "the user not exists"
					})
				}
				return reply.code(201).send({
					success:true,
					avatarPath:user.avatar
				})
			}catch(error)
			{
				fastify.log.error(error);
				reply.code(500).send({
				success: false,
				message: "Internal Server Error: Could not save file"
				});
			}
		}
	})

	fastify.route({
	method: 'GET',
	url: '/api/user/:id',
	handler: async function readAccount (request, reply) {
		const header = request.headers.authorization;
		if (!header || !header.startsWith('Bearer')){
			return (reply.code(401).send("Unaouthorized: Token missing or invalid format"))
		}
		const token = header.substring(7);
		try{
			await fastify.jwtd.verifyToken(token);
			const user = db.prepare("SELECT 1 FROM users WHERE token = ?").get(token);
			if (!user)
				return(reply.code(401).send({message: "Token is expired sign in again"}))
		}catch(err){
			return(reply.code(401).send("Unauthorized: Invalid or expired token"));
		}
		const id = request.params.id;
		const user = fastify.db.prepare("SELECT 1 FROM users WHERE id=?").get(id);
		if (!user)
			return(reply.code(404).send("User id is not exist"))
		return(reply.code(200).send({
			status: user.status,

			}));
		}
	})

	fastify.route({
		method: 'PUT',
		url: '/api/user/update_password',
		handler: async function updatePassword(request, reply)
		{
			const auth = request.headers.authorization
			if (!auth || !auth.startsWith('Bearer'))
				return(reply.code(401).send({
					success: false,
					message: "Unaouthorized: Token missing or invalid format"}));

			const token = auth.substring(7);
			try{
				await fastify.jwtd.verifyToken(token);
			}catch(err){
				return(reply.code(401).send({
					success: false,
					message:"Unauthorized: Invalid or expired token"}));
			}

			const {oldPassword, newPassword} = request.body;
			if (oldPassword === newPassword)
				return reply.code(404).send({
				success: false,
				message:"the new password must be diffrent with the old password"
			});


			const getUser = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
			if (!getUser)
				return reply.code(404).send({
					success: false,
					message:"Token is expired sign in again"
			});
			
			const isMatch = await fastify.crypt_pass.verify_pass(getUser.password, oldPassword, getUser.salt);
			if (!isMatch)
				return reply.code(404).send({
					success: false,
					message: "Wrong password"});
			const hash_password = await fastify.crypt_pass.getHash(newPassword, getUser.salt);
			const stm = db.prepare("UPDATE users SET password = ? WHERE token = ?");
			stm.run(hash_password, token);
			return(reply.code(201).send({
				success: true,
				message: "The password has ben changed succesfuly",
			}));
		}
	})

	fastify.route({
		method: 'PUT',
		url: '/api/user/update_username',
		handler: async function updatePassword(request, reply)
		{
			const auth = request.headers.authorization
			if (!auth || !auth.startsWith('Bearer'))
				return(reply.code(401).send({
					success: false,
					message: "Unaouthorized: Token missing or invalid format"}));
			const token = auth.substring(7);
			try{
				await fastify.jwtd.verifyToken(token);
			}catch(err){
				return(reply.code(401).send({
					success:false,
					message:"Unauthorized: Invalid or expired token"}));
			}
			const {newUsername, password} = request.body;
			const user_a = db.prepare("SELECT * FROM users WHERE username = ?").get(newUsername);
			if (user_a)
				return(reply.code(404).send({
					success:false,
					message: "Use an other username"}));
			const getUser = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
			if (!getUser)
				return(reply.code(404).send({
					success:false,
					message:"Token expired sign in again"}));
			const isMatch = await fastify.crypt_pass.verify_pass(getUser.password, password, getUser.salt);
			if (!isMatch)
				return reply.code(404).send({
					success:false,
					message:"Incorrect password"});
			const stm = db.prepare("UPDATE users SET username = ? WHERE token = ?").run(newUsername, token);//update the jwt with new username !!!!!!
			return(reply.code(200).send({
				success: true,
				message: "Username changed successfuly",
			}));
		}
	})

	fastify.route({
		method: 'PUT',
		url: '/api/user/update_email',
		handler: async function updatePassword(request, reply)
		{
			const auth = request.headers.authorization
			if (!auth || !auth.startsWith('Bearer '))
				return(reply.code(401).send({message:"Unaouthorized: Token missing or invalid format"}));
			const token = auth.substring(7);
			try{
				await fastify.jwtd.verifyToken(token);
			}catch(err){
				return(reply.code(401).send({message:"Unauthorized: Invalid or expired token"}));
			}
			const {newAddress,password} = request.body;
			const a_used = db.prepare('SELECT * FROM users WHERE email = ?').get(newAddress);
			if (a_used)
			{
				return reply.code(404).send({
					success: false,
					message: 'This address already in use'});
			}
			const user = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
			if (!user)
				return(reply.code(404).send({message:"Token is expired sign in again"}));
			const isMatch = await fastify.crypt_pass.verify_pass(user.password, password, user.salt);
			if (!isMatch)
				return reply.code(404).send({
					success:false,
					message:"Incorrect password"});
			if (user.email === newAddress)
				return reply.code(401).send({
					success: false,
					message:"New email must be diffrent"});
			const stm = db.prepare("UPDATE users SET email = ? WHERE token = ?").run(newAddress, token);
			return(reply.code(200).send({
				success: true,
				message:"Email changed successfuly"
			}));
		}
	})

	fastify.route({
		method: 'GET',
		url:'/api/user/logOut',
		handler: async function logout(request, reply)
		{
			const auth = request.headers.authorization;
			if (!auth || !auth.startsWith('Bearer '))
			{
				return reply.code(401).send(
					{
						message: "Unaouthorized: Token missing or invalid format"
					}
				)
			}
			const newToken = auth.substring(7);
			try{
				await fastify.jwtd.verifyToken(newToken);
			}catch(err)
			{
				return reply.code(401).send({
					message: "Unauthorized: Invalid or expired token"
				})
			}
			try{
					const getOldToken = db.prepare("SELECT * FROM users WHERE token = ?").get(newToken);
					if (!getOldToken)
					{
						return reply.code(401).send({
							message: "Token is expired. Please sign in again"
						});
					}
					if (getOldToken.token !== newToken)
					{
						return reply.code(401).send(
							{
								message: "Token is expired. Please sign in again"
							}
						)
					}
				const user = db.prepare('UPDATE users SET status = ? WHERE token = ? ').run(0, newToken);
				if (!user)
				{
					const error = new Error('Internel server error');
					error.statusCode = 500;
					throw error;
				}

			}catch(err){
				return reply.code(500).send(err);
			}
			return reply.code(200).send({
				success: true,
				message: "Successfuly logged out"
			});
		}
	})

	fastify.route({
		method: "PUT",
		url: "/api/user/update_avatar",
		handler: async function update_avatar(request, reply) {
			const auth = request.headers.authorization;
			if (!auth || !auth.startsWith('Bearer ')) {
				return reply.code(401).send(
				{
					success: false,
					message: "Unauthorized: Token missing or invalid format"
				}
				);
			}
			const token = auth.substring(7);
			try{
				await fastify.jwtd.verifyToken(token);
			}catch(err)
			{
				return reply.code(401).send({
					message: "Unauthorized: Invalid or expired token"
				})
			}
			const user_a = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
			if (!user_a)
			{
				return reply.code(401).send({
					success: false,
					message: "The token is expired"
				});
			}
			const userId = 1;
			const data = await request.file();

			if (!data) {
				return reply.code(400).send({
				success: false,
				message: "Bad Request: No file uploaded"
				});
			}
			if (!data.mimetype.startsWith('image/')) {
				return reply.code(400).send({
					success: false,
					message: "Bad Request: Only image files are allowed"
				});
			}

			const fileExtension = path.extname(data.filename) || '.jpg';
			const newFilename = `${userId}_avatar_${Date.now()}${fileExtension}`;
			const filePath = path.join(UPLOADS_DIR, newFilename);
			
			try {
				const avatarPathInDB = `/uploads/${newFilename}`;
				db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(avatarPathInDB, userId);
				await pipeline(data.file, createWriteStream(filePath));      
				return reply.code(200).send({
				success: true,
				message: "Avatar updated successfully"
				});
			} catch (error) {
				fastify.log.error(error);
				reply.code(500).send({
				success: false,
				message: "Internal Server Error: Could not save file"
				});
			}
		}
	});

	fastify.route({
		method: "PUT",
		url: "/api/user/forgot-password",
		handler: async function forgot_password(request, reply) {
			const {email} = request.body;

			let user_a;
			
			try {
				user_a = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
				if (!user_a)
				{
					return reply.code(401).send({
						success:false,
						message: "unused email address"
					})
				}
				const newPass = fastify.randomValGenerator.securePassword(10, 13);
				const hash_password = await fastify.crypt_pass.getHash(newPass, user_a.salt);
				const stm = db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hash_password, email);

				const mailOptions = {
					from: '"ft_transcendance" <no-reply@ft_transcendance.com>',
					to: email,
					subject: 'Your Password Reset Code',
					text: `Your password reset code is: ${newPass}. This code will expire in 10 minutes. 
							Please enter this code on the password reset page to continue.`,
					html: `
						<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
							<h2>Password Reset Request</h2>
							<p>We received a request to reset the password for your account.</p>
							<p>Your <strong>6-digit verification code</strong> is:</p>
							<div style="font-size: 24px; font-weight: bold; background-color: #f4f4f4; padding: 10px; margin: 15px 0; display: inline-block; border-radius: 5px;">
								${newPass}
							</div>
							<p>This code is valid for <strong>10 minutes</strong>.</p>
							<p>If you did not request this, you can safely ignore this email.</p>
						</div>
					`
			};
				let info = await fastify.mailer.sendMail(mailOptions);
				return reply.code(200).send({
					success: true,
					message: 'Password reset code has been sent to your email.'
				});
			} catch (error) {
				return reply.code(500).send({
					success: false,
					message: "Internal server error."
				})
			}
		}
	});

		fastify.route({
		method: "PUT",
		url: "/api/user/reset-password",
		handler: async function forgot_password(request, reply) {
			const auth = request.headers.authorization;
			if (!auth || !auth.startsWith('Bearer ')) {
				return reply.code(401).send(
				{
					success: false,
					message: "Unauthorized: Token missing or invalid format"
				});
			}
			const token = auth.substring(7);
			try{
				await fastify.jwtd.verifyToken(token);
			}catch(err)
			{
				return reply.code(401).send({
					success: false,
					message: "Unauthorized: Invalid or expired token"
				})
			}
			try {
				const {NewPassword} = request.body;

				const user_a = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
				if (!user_a)
				{
					return reply.code(401).send({
						success:false,
						message: "Unauthorized: Invalid or expired token"
					})
				}
				const hash_password = await fastify.crypt_pass.getHash(NewPassword, user_a.salt);
				const stm = db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hash_password, user_a.email);
					return reply.code(200).send({
						success: true,
						message: 'your password has been changed.'
					});
			} catch (error) {
				return reply.code(500).send({
					success: false,
					message: "Internal server error."
				})
			}
		}
	});

}