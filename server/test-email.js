import nodemailer from 'nodemailer'
import 'dotenv/config'

const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ SMTP_USER / SMTP_PASS 未在 .env 配置。请先 cp .env.example .env 并填入真实值。')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: { user: SMTP_USER, pass: SMTP_PASS }
})

const message = `🍽️ 壮壮又馋啦
2026-02-12 午餐
想吃红烧肉、炒青菜
需要的食材是猪肉、酱油、糖、青菜、蒜
备注：少放盐`

const RECIPIENT = process.env.ORDER_NOTIFY_TO || SMTP_USER

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Ronnie Portfolio'}" <${process.env.SMTP_FROM_EMAIL || SMTP_USER}>`,
      to: RECIPIENT,
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