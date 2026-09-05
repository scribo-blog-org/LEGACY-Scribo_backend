function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

module.exports = function passwordResetCodeTemplate({
    code,
    nickName,
    expiresInMinutes = 10
}) {
    return `
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Сброс пароля</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f6f6f6;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="100%" style="max-width:520px;background:#ffffff;border-radius:8px;padding:24px;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td>
                <h2 style="margin:0 0 12px 0;color:#111;">Сброс пароля</h2>
                <p style="color:#333;font-size:15px;line-height:1.5;margin:0 0 16px 0;">
                  ${escapeHtml(nickName || "Здравствуйте")}, вы запросили сброс пароля для аккаунта Scribo.
                  Код действует ${escapeHtml(expiresInMinutes)} минут.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 0 20px;">
                <div style="display:inline-block;letter-spacing:8px;font-size:28px;font-weight:700;color:#111;background:#f6f6f6;padding:12px 20px;border-radius:8px;">
                  ${escapeHtml(code)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="color:#333;font-size:15px;line-height:1.5;">
                Если это были не вы, проигнорируйте письмо — пароль не изменится без кода.
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;border-top:1px solid #eaeaea;color:#777;font-size:12px;">
                <p style="margin:0;">Scribo Blog<br/>Это письмо отправлено автоматически.</p>
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
