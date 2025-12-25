import fastify, {FastifyError, FastifyInstance, FastifyPluginAsync} from "fastify";
import fp from 'fastify-plugin'
import  Database from 'better-sqlite3';
import path from "path";

const DatabasePlugin:FastifyPluginAsync = async (fastify)=>{
    const dbPath = path.resolve(process.cwd(), 'DATABASE.db');
    const db = new Database(dbPath);

    db.prepare(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY,
        username TEXT,
        password TEXT,
        email TEXT,
        salt TEXT,
        token TEXT,
        Avatar TEXT,
        status NUMERIC
        )`).run();

        fastify.decorate('db', db);
        fastify.addHook('onClose', ()=>{
            db.close();
        })
}

export default fp(DatabasePlugin, {
    name: 'database'
})
