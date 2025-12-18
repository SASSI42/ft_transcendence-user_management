const fp = require('fastify-plugin');
const oauthPlugin = require('@fastify/oauth2')
const fetch = require('node-fetch');

module.exports = fp(async function autht(fastify, opts)
{
  fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: '1018186253817-knfjv7eqdv5toi4er69e8trs899eqco2.apps.googleusercontent.com',
        secret: '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'
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/login/google',
    callbackUri: 'http://localhost:3000/login/google/callback',
    scope: ['email', 'profile']
  })

  // fastify.get('/login/google/callback', async function (request, reply) {
  //   try{
  //   const {token} = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
  //   request.log.info('Access Token:', token.access_token);

  //   const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
  //     headers: { Authorization: `Bearer ${token.access_token}` }
  //   });
  //   return reply.code(201).send(await res.json());
  //   }catch(err)
  //   {
  //     return reply.code(500).send({error: "The login failed"});
  //   }
  // })
})