export function createVerificationEmail(
  firstName: string,
  lastName: string,
  middleName: string | null,
  verificationUrl: string
): string {
  return `
    <div style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: Arial, sans-serif; color: #0f172a;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.5; font-weight: bold;">
          Вітаю, ${lastName} ${firstName}${middleName ? " " + middleName : ""}.
        </p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">
          Щоб завершити реєстрацію, підтвердіть адресу електронної пошти.
        </p>
        <div style="text-align: center;">
          <a
            href="${verificationUrl}"
            style="display: inline-block; box-sizing: border-box; border-radius: 12px; background-color: #0284c7; padding: 12px 32px; font-size: 16px; font-weight: 700; line-height: 1.5; color: #ffffff; text-align: center; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.35), 0 4px 6px -4px rgba(14, 165, 233, 0.35);"
          >
            Підтеврдити адресу
          </a>
        </div>
      </div>
    </div>
  `.trim();
}

export function createSetPasswordEmail(
  firstName: string,
  lastName: string,
  middleName: string | null,
  setPasswordUrl: string
): string {
  return `
    <div style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: Arial, sans-serif; color: #0f172a;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.5; font-weight: bold;">
          Вітаю, ${lastName} ${firstName}${middleName ? " " + middleName : ""}.
        </p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5;">
          Вам було створено акаунт лікаря для додатку Anamnesis. Щоб користуватись додатком, встановіть, будь ласка, пароль.
        </p>
        <div style="text-align: center;">
          <a
            href="${setPasswordUrl}"
            style="display: inline-block; box-sizing: border-box; border-radius: 12px; background-color: #0284c7; padding: 12px 32px; font-size: 16px; font-weight: 700; line-height: 1.5; color: #ffffff; text-align: center; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.35), 0 4px 6px -4px rgba(14, 165, 233, 0.35);"
          >
            Встановити пароль
          </a>
        </div>
      </div>
    </div>
  `.trim();
}
