import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: 'REDACTED-SMTP-USER@example.invalid',
    pass: 'REDACTED-SMTP-PASS'
  }
})

const message = `🍽️ 壮壮又馋啦
2026-02-12 午餐
想吃红烧肉、炒青菜
需要的食材是猪肉、酱油、糖、青菜、蒜
备注：少放盐`

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: '"Ronnie Portfolio" <REDACTED-SMTP-USER@example.invalid>',
      to: 'REDACTED-SMTP-USER@example.invalid',
      subject: '🍽️ 测试点餐邮件通知',
      text: message,
      html: `<pre style="font-family: sans-serif; white-space: pre-wrap;">${message}</pre>`
    })
    console.log('✅ 邮件发送成功:', info.messageId)
  } catch (e) {
    console.error('❌ 邮件发送失败:', e.message)
  }
}

testEmail()
