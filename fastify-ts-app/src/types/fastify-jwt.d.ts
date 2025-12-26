import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    // This defines the type of 'request.user'
    user: {
      id: number;
      username: string;
      email?: string;
    }
  }
}