import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({

  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export async function wyslijMaila(to: string | string[], subject: string, html: string) {
  const from = process.env.MAIL_FROM || "no-reply@op.pl";
  await mailer.sendMail({ from, to, subject, html });
}

