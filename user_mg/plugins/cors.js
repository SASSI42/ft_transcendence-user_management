'use strict'

const cors = require('@fastify/cors')
const fp = require('fastify-plugin')

module.exports = fp(async function core(fastify, opts) {
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
})
