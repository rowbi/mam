import { logoBase64 } from './logo.js';
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function enquiryEmail({ first, last, email, message }) {
  const name = `${first.trim()} ${last.trim()}`;
  const address = email.trim();
  const project = message.trim();
  const emailLink = `mailto:${encodeURIComponent(address)}`;
  return {
    text: `Name: ${name}\nEmail: ${address}\n\n${project}`,
    html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>New website enquiry — MAM London</title></head>
<body style="margin:0;padding:0;background-color:#f3f2ef;color:#1c2d49;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A new project enquiry from ${escapeHtml(name)}.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f2ef;"><tr><td align="center" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e1d8;border-top:4px solid #d3a156;">
<tr><td style="padding:32px 28px 24px;"><img src="cid:mam-logo" width="280" height="46" alt="MAM London" style="display:block;width:280px;max-width:100%;height:auto;border:0;"></td></tr>
<tr><td style="padding:0 28px 24px;"><p style="margin:0 0 10px;color:#936b30;font-size:11px;font-weight:700;letter-spacing:2px;line-height:1.5;">WEBSITE CONTACT FORM</p><h1 style="margin:0 0 12px;color:#1c2d49;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;line-height:1.3;">New project enquiry</h1><p style="margin:0;color:#626977;font-size:14px;line-height:1.7;">Someone has contacted MAM London about their project. Their submitted details are below.</p></td></tr>
<tr><td style="padding:0 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #e5e1d8;">
<tr><td style="padding:20px 0 16px;border-bottom:1px solid #e5e1d8;"><p style="margin:0 0 6px;color:#626977;font-size:12px;font-weight:700;line-height:1.5;">NAME</p><p style="margin:0;color:#1c2d49;font-size:16px;line-height:1.6;word-break:break-word;">${escapeHtml(name)}</p></td></tr>
<tr><td style="padding:18px 0;border-bottom:1px solid #e5e1d8;"><p style="margin:0 0 6px;color:#626977;font-size:12px;font-weight:700;line-height:1.5;">EMAIL ADDRESS</p><p style="margin:0;font-size:16px;line-height:1.6;word-break:break-word;"><a href="${emailLink}" style="color:#1c2d49;text-decoration:underline;">${escapeHtml(address)}</a></p></td></tr>
<tr><td style="padding:20px 0 28px;"><p style="margin:0 0 12px;color:#626977;font-size:12px;font-weight:700;line-height:1.5;">YOUR PROJECT</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:18px;background-color:#f7f6f3;border-left:3px solid #d3a156;color:#1c2d49;font-size:15px;line-height:1.8;word-break:break-word;">${escapeHtml(project).replace(/\r\n|\r|\n/g, '<br>')}</td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:0 28px 32px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#d3a156" style="border-radius:3px;"><a href="${emailLink}" style="display:inline-block;padding:14px 24px;border:1px solid #d3a156;border-radius:3px;color:#172033;font-size:14px;font-weight:700;line-height:1.5;text-decoration:none;">Reply to enquiry</a></td></tr></table><p style="margin:16px 0 0;color:#626977;font-size:12px;line-height:1.7;">You can also reply directly to this email to contact the sender.</p></td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #e5e1d8;background-color:#faf9f7;color:#626977;font-size:12px;line-height:1.7;">Submitted through the MAM London website<br><a href="https://mam.london" style="color:#1c2d49;text-decoration:underline;">mam.london</a></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`,
    attachments: [{ filename: 'mam-london.png', content: logoBase64, content_id: 'mam-logo' }]
  };
}
