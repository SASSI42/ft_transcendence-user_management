'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/dd', async function (request, reply) {
    return 'this is an example'
  })
}
