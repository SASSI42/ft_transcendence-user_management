'use strict'

const fp = require('fastify-plugin')
const nodemailer = require('nodemailer');

module.exports = fp(async function nodemailerTransporter(fastify, options) {
    
    const TEST_EMAIL_USER = 'mmehdienassiri90@gmail.com';
    const TEST_EMAIL_PASS = 'cdaq bwsx jnqh repk';
    
    let transporter;

    try {
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            
            auth: {
                user: TEST_EMAIL_USER, 
                pass: TEST_EMAIL_PASS
            }
        });
        await transporter.verify();
        fastify.log.info('Nodemailer transporter successfully connected and verified.');
        
    } catch (error) {
        transporter = {
            sendMail: () => {
                throw new Error("Mailer not initialized. Cannot send email.");
            }
        };
    }
    fastify.decorate('mailer', transporter);
});