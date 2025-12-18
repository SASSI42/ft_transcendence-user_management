const fp = require('fastify-plugin');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');

module.exports = fp(async function two_factor(fastify, opts) {

  // ---- EMAIL SENDER ----
  fastify.decorate('sendEmail', async function ({ to, subject, text }) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: "no-reply@yourapp.com",
      to,
      subject,
      text
    });
  });


  // ---- CREATE 2FA SECRET (store in DB) ----
  fastify.post('/2fa/setup', async (req, reply) => {
    const secret = speakeasy.generateSecret({
      name: 'ft_transcendance (' + req.body.email + ')'
    });

    console.log("<<< " + secret.otpauth_url + " >>>");

    // TODO: save secret.base32 in DB under the user
    // await db.updateUser(req.user.id, { twoFaSecret: secret.base32 });

    reply.send({ otpauth_url: secret.otpauth_url });
  });

  
  // ---- STEP 1: password login → send 2FA code ----
  fastify.post('/login/request-2fa', async (req, reply) => {
    const { email, password } = req.body;

    const user = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    // if (!user || !verifyPassword(user, password)) {
    //   return reply.code(401).send({ error: 'Invalid credentials' });
    // }

    // Generate TOTP code
    const token = speakeasy.totp({
      secret: user.twoFaSecret,
      encoding: 'base32'
    });

    // Send email
    await fastify.sendEmail({
      to: email,
      subject: "Your 2FA login code",
      text: `Your login code is: ${token}`
    });

    reply.send({ message: "2FA code sent to email." });
  });


  // ---- STEP 2: verify emailed 2FA code ----
  fastify.post('/login/verify-2fa', async (req, reply) => {
    const { email, token } = req.body;

    const user = await db.findUserByEmail(email);
    if (!user)
      return reply.code(404).send({ error: "User not found" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token,
      window: 2   // allow slight delay
    });

    if (!verified) {
      return reply.code(401).send({ error: "Invalid 2FA code" });
    }

    const jwtToken = fastify.jwt.sign({ userId: user.id });
    reply.send({ token: jwtToken });
  });

});
