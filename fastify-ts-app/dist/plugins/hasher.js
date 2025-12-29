"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const encryption = async (fastify) => {
    async function getSalt() {
        return node_crypto_1.default.randomBytes(16).toString('hex');
    }
    async function getHash(password, salt) {
        return (node_crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex'));
    }
    async function verify_pass(hashPassword, password, salt) {
        const newHash = node_crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
        return (newHash === hashPassword);
    }
    fastify.decorate("crypt_pass", {
        getSalt,
        getHash,
        verify_pass
    });
};
exports.default = (0, fastify_plugin_1.default)(encryption, {
    name: 'crypt'
});
