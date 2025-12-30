"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
async function authMiddleware(request, reply) {
    try {
        // This automatically checks the 'Authorization: Bearer <token>' header
        await request.jwtVerify();
    }
    catch (err) {
        reply.send(err);
    }
}
