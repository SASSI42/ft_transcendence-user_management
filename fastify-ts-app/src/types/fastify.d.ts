import 'fastify'
import Database from 'better-sqlite3'

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database

    crypt_pass:{
        getSalt: () => Promise<string>;
        getHash: (password:string, salt:string) => Promise<string>;
        verify_pass: (hashPassword:string, password:string, salt:string) => Promise<boolean>;
    }
    jwtUtil:{
        getToken: (payload:object) => any;
        verifyToken: (token:string) => any;
    }
    }
}