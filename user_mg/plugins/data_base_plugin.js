'use strict'

const fp = require('fastify-plugin');
const Data_base = require('better-sqlite3');

module.exports = fp(async function dbPlugin(fastify, opts){
    let db;
    try{
         db = new Data_base('DATA_BASE.db');
    }catch(err)
    {
        const error = new Error('An unexpected error occurred on the server');
        error.statusCode = 500;
        throw error
    }
    try{
        const users = db.prepare(`CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY,
            username TEXT,
            password TEXT,
            email TEXT,
            salt TEXT,
            token TEXT,
            Avatar TEXT,
            status NUMERIC
        )`).run();

    }catch(err)
    {
        const error  = new Error('An unexpected error occurred on the server');
        error.statusCode = 500;
        throw error;

    }
    fastify.decorate('db', db);
}, {
    name: 'data_base'
});