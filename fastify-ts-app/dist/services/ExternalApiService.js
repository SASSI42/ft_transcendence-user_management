"use strict";
// import axios from 'axios';
// import database from '../plugins/data_base';
// // Uses the URL defined in your .env file
// const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4000';
// export interface ExternalUser {
//     id: string;
//     username: string;
//     email: string;
//     avatarUrl?: string;
// }
// export class ExternalApiService {
//     static async ensureUserExists(userId: string): Promise<void> {
//         const localUser = database.prepare('SELECT id FROM users WHERE id = ?').get(userId);
//         if (!localUser) {
//             // 🛠️ CHANGED: Instead of creating a mock user, we now warn/error.
//             // This forces us to rely on the 'initDatabase' seeding or the real Auth Service.
//             console.warn(`⚠️ Warning: User ${userId} does not exist in local DB! Request might fail.`);
//             // Optional: If you still want "Lazy Creation" for unknown IDs (e.g. testing User 99),
//             // you can uncomment the old logic here. But for 1, 2, 3 it's no longer needed.
//         }
//     }
//     static async fetchUserProfile(userId: string): Promise<ExternalUser | null> {
//         try {
//             const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
//             return response.data;
//         } catch (error) {
//             return null;
//         }
//     }
// }
