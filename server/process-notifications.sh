#!/bin/bash
# Script to process pending notifications and send via OpenClaw
# Called by cron every 5 minutes

cd /home/ubuntu/.openclaw/workspace

# Check if there are pending notifications
PENDING=$(mongo ronnie_portfolio --quiet --eval "db.notifications.countDocuments({status: 'pending'})" 2>/dev/null || echo "0")

if [ "$PENDING" -gt 0 ]; then
    echo "[$(date)] 发现 $PENDING 个待处理的通知"
    
    # Use OpenClaw to send WhatsApp message
    openclaw message send --channel whatsapp --target "+8619512244066" --message "🍽️ 您有新的点餐订单，请查看网站" 2>/dev/null
    
    # Update notification status
    mongo ronnie_portfolio --quiet --eval "
        db.notifications.updateMany(
            {status: 'pending'},
            {
                \$set: {
                    status: 'sent',
                    sentAt: new Date(),
                    messageId: 'cron-' + Date.now()
                }
            }
        )
    " 2>/dev/null
    
    echo "[$(date)] 通知已发送"
else
    echo "[$(date)] 没有待处理的通知"
fi
