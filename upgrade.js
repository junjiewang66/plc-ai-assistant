class UpgradeManager {
    constructor() {
        this.checkAuthentication();
        this.loadUserStatus();
    }
    
    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    async loadUserStatus() {
        const token = localStorage.getItem('token');
        const userInfo = document.getElementById('userInfo');
        
        try {
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const user = data.user;
                let statusText;
                
                if (user.is_premium) {
                    statusText = `${user.username}（完整版用户）- 无限制提问`;
                } else {
                    statusText = `${user.username}（免费版用户）- 剩余 ${user.questions_remaining} 次提问`;
                }
                
                userInfo.textContent = statusText;
                
                // 如果是付费用户，更新页面显示
                if (user.is_premium) {
                    this.updateForPremiumUser();
                }
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            userInfo.textContent = '无法获取用户状态';
        }
    }
    
    updateForPremiumUser() {
        // 更新免费版状态
        const freeCard = document.querySelector('.plan-card.free');
        const freeStatus = freeCard.querySelector('.plan-status');
        freeStatus.textContent = '已升级';
        freeStatus.style.background = '#e0e0e0';
        
        // 更新完整版状态
        const premiumCard = document.querySelector('.plan-card.premium');
        const premiumPrice = premiumCard.querySelector('.price');
        premiumPrice.textContent = '已开通';
        
        // 添加当前版本标识
        const currentStatus = document.createElement('div');
        currentStatus.className = 'plan-status';
        currentStatus.textContent = '当前版本';
        currentStatus.style.background = 'rgba(255, 255, 255, 0.2)';
        currentStatus.style.color = 'white';
        premiumCard.appendChild(currentStatus);
    }
}

function copyWeChatId() {
    const wechatId = 'dream666333';
    
    // 尝试使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(wechatId).then(() => {
            showMessage('微信号已复制到剪贴板！', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(wechatId);
        });
    } else {
        // 降级处理
        fallbackCopyTextToClipboard(wechatId);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showMessage('微信号已复制到剪贴板！', 'success');
        } else {
            showMessage('复制失败，请手动复制微信号：dream666333', 'info');
        }
    } catch (err) {
        showMessage('复制失败，请手动复制微信号：dream666333', 'info');
    }
    
    document.body.removeChild(textArea);
}

function showMessage(message, type = 'info') {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 3000);
}

function goBack() {
    window.location.href = 'index.html';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new UpgradeManager();
});