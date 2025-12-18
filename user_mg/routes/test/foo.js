module.exports = async function (fastify, opts) {
    fastify.get('/ddy', async function (request, reply) {
        return 'this is an example';
})
}