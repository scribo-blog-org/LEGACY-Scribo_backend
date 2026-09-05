function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

module.exports = function passwordChangedTemplate({ nickName, time, settingsUrl }) {
    const button = settingsUrl
        ? `<tr>
              <td align="center" style="padding-top:20px;">
                <a href="${escapeHtml(settingsUrl)}" style="display:inline-block;padding:10px 16px;background:#191919;color:#ffffff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;">
                  Открыть сеансы
                </a>
              </td>
            </tr>`
        : ""

    return `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Пароль изменён</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f6f6;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;padding:24px;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td>
                <h2 style="margin:0 0 12px 0;color:#111;">Пароль изменён</h2>
                <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 12px 0;">
                  ${escapeHtml(nickName || "Здравствуйте")}, пароль вашего аккаунта Scribo только что изменили.
                </p>
                <p style="color:#333;font-size:15px;line-height:1.5;margin:0;">
                  Время: <b>${escapeHtml(time)}</b>
                </p>
                <p style="color:#333;font-size:15px;line-height:1.5;margin:16px 0 0 0;">
                  Если это были не вы, завершите чужие сеансы и напишите в поддержку.
                </p>
              </td>
            </tr>
            ${button}
            <tr>
              <td style="padding-top:24px;border-top:1px solid #eaeaea;color:#777;font-size:12px;">
                <p style="margin:0;">Scribo Blog<br/>Это письмо отправлено автоматически после смены пароля.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
}
