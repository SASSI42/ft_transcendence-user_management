'use strict'

const fp = require('fastify-plugin')
const multipart = require('@fastify/multipart')

module.exports = fp(async function (fastify, opts) {
  fastify.register(multipart, {
  })
})