import nodemailer from "nodemailer";
import { createSetPasswordEmail, createVerificationEmail } from "./templates";

export class EmailService {
  private static readonly transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  public static async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string
  ) {
    const info = await EmailService.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    return info;
  }

  public static async sendVerificationEmail({
    to,
    token,
    firstName,
    lastName,
    middleName,
  }: {
    to: string;
    token: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  }) {
    const verificationUrl = `${process.env.BACKEND_URL}/user/verify-email?token=${token}`;
    // const html = `
    //   <p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>
    // `;
    const html = createVerificationEmail(
      firstName,
      lastName,
      middleName,
      verificationUrl
    );
    return EmailService.sendEmail(to, "Anamnesis Email Verification", "", html);
  }

  public static async sendSetPasswordEmail({
    to,
    token,
    firstName,
    lastName,
    middleName,
  }: {
    to: string;
    token: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  }) {
    const setPasswordUrl = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    const html = createSetPasswordEmail(
      firstName,
      lastName,
      middleName,
      setPasswordUrl
    );
    return EmailService.sendEmail(to, "Anamnesis Set Password", "", html);
  }
}
