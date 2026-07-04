// Plain HTML string templates with inline styles — the only style approach
// that reliably renders across email clients (no external stylesheets, no
// Tailwind utility classes). Colors match the Premium Elegance palette in
// docs/10-brand-package.md.

const COLORS = {
  navy: "#1a2332",
  gold: "#c9a961",
  cream: "#f5f1e8",
  charcoal: "#2c2c2c",
};

export function emailButton(href: string, label: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${COLORS.gold};">
          <a href="${href}" style="display: inline-block; padding: 12px 24px; font-family: Georgia, serif; font-size: 15px; font-weight: bold; color: ${COLORS.navy}; text-decoration: none;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function emailShell({
  preheader,
  bodyHtml,
}: {
  preheader: string;
  bodyHtml: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Case Atlas</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLORS.cream}; font-family: Helvetica, Arial, sans-serif;">
    <span style="display: none; max-height: 0; overflow: hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.cream};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: ${COLORS.navy}; padding: 24px 32px;">
                <span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #ffffff;">Case </span><span style="font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: ${COLORS.gold};">Atlas</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px; color: ${COLORS.charcoal}; font-size: 15px; line-height: 1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; border-top: 1px solid #ded6c4; color: #8a8378; font-size: 12px; line-height: 1.6;">
                <p style="margin: 0 0 8px;">Case Atlas is a software product. It does not provide tax, legal, or investment advice.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Peakbritt Financial Group.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
