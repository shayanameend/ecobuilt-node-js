import { env } from "~/lib/env";
import { nodemailerTransporter } from "~/lib/nodemailer";

async function sendOTP({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  nodemailerTransporter.sendMail(
    {
      from: {
        name: env.APP_NAME,
        address: env.APP_SUPPORT_EMAIL,
      },
      to,
      subject: "Verify Your Email",
      text: `Your OTP Code is: ${code}`,
    },
    (err) => {
      if (err) {
        console.error(err);
      }
    },
  );
}

async function sendMessage({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  nodemailerTransporter.sendMail(
    {
      from: {
        name: env.APP_NAME,
        address: env.APP_SUPPORT_EMAIL,
      },
      to,
      subject,
      text,
    },
    (err) => {
      if (err) {
        console.error(err);
      }
    },
  );
}

export { sendOTP, sendMessage };
