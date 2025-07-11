class AdminManager {
    constructor() {
        this.adminKey = '';
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // 认证相关
        this.authSection = document.getElementById('authSection');
        this.adminPanel = document.getElementById('adminPanel');
        this.adminAuthForm = document.getElementById('adminAuthForm');
        this.adminKeyInput = document.getElementById('adminKey');
        this.authBtnText = document.getElementById('authBtnText');
        this.authLoader = document.getElementById('authLoader');
        
        // 付费用户设置
        this.premiumForm = document.getElementById('premiumForm');
        this.premiumUsername = document.getElementById('premiumUsername');
        this.premiumAction = document.getElementById('premiumAction');
        this.premiumBtnText = document.getElementById('premiumBtnText');
        this.premiumLoader = document.getElementById('premiumLoader');
        
        // 问题次数设置
        this.questionsForm = document.getElementById('questionsForm');
        this.questionsUsername = document.getElementById('questionsUsername');
        this.questionsCount = document.getElementById('questionsCount');
        this.questionsBtnText = document.getElementById('questionsBtnText');
        this.questionsLoader = document.getElementById('questionsLoader');
        
        // 消息显示
        this.messageElement = document.getElementById('message');
    }
    
    bindEvents() {
        this.adminAuthForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });
        
        this.premiumForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePremiumUpdate();
        });
        
        this.questionsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleQuestionsUpdate();
        });
    }
    
    async handleAuth() {
        const adminKey = this.adminKeyInput.value.trim();
        
        if (!adminKey) {
            this.showMessage('请输入管理员密钥', 'error');
            return;
        }
        
        this.setAuthLoading(true);
        
        // 直接验证密钥
        if (adminKey === 'plc-admin-2024') {
            this.adminKey = adminKey;
            this.showAuthenticatedPanel();
            this.showMessage('管理员身份验证成功', 'success');
        } else {
            this.showMessage('管理员密钥错误', 'error');
        }
        
        this.setAuthLoading(false);
    }
    
    showAuthenticatedPanel() {
        this.authSection.classList.add('hidden');
        this.adminPanel.classList.remove('hidden');
    }
    
    async handlePremiumUpdate() {
        const username = this.premiumUsername.value.trim();
        const action = this.premiumAction.value;
        
        if (!username || !action) {
            this.showMessage('请填写所有字段', 'error');
            return;
        }
        
        this.setPremiumLoading(true);
        
        try {
            const response = await fetch('/api/admin/update-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminKey: this.adminKey,
                    username: username,
                    setPremium: action === 'true'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const actionText = action === 'true' ? '设为付费用户' : '取消付费用户';
                this.showMessage(`成功${actionText}：${username}`, 'success');
                this.premiumForm.reset();
            } else {
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('更新失败:', error);
            this.showMessage('网络错误，请重试', 'error');
        }
        
        this.setPremiumLoading(false);
    }
    
    async handleQuestionsUpdate() {
        const username = this.questionsUsername.value.trim();
        const questionsCount = parseInt(this.questionsCount.value);
        
        if (!username || !questionsCount || questionsCount < 1) {
            this.showMessage('请正确填写用户名和问题次数', 'error');
            return;
        }
        
        this.setQuestionsLoading(true);
        
        try {
            const response = await fetch('/api/admin/update-questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminKey: this.adminKey,
                    username: username,
                    questionsToAdd: questionsCount
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage(`成功为用户 ${username} 增加 ${questionsCount} 次提问`, 'success');
                this.questionsForm.reset();
            } else {
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('更新失败:', error);
            this.showMessage('网络错误，请重试', 'error');
        }
        
        this.setQuestionsLoading(false);
    }
    
    setAuthLoading(loading) {
        const btn = this.adminAuthForm.querySelector('.auth-btn');
        btn.disabled = loading;
        this.authBtnText.classList.toggle('hidden', loading);
        this.authLoader.classList.toggle('hidden', !loading);
    }
    
    setPremiumLoading(loading) {
        const btn = this.premiumForm.querySelector('.action-btn');
        btn.disabled = loading;
        this.premiumBtnText.classList.toggle('hidden', loading);
        this.premiumLoader.classList.toggle('hidden', !loading);
    }
    
    setQuestionsLoading(loading) {
        const btn = this.questionsForm.querySelector('.action-btn');
        btn.disabled = loading;
        this.questionsBtnText.classList.toggle('hidden', loading);
        this.questionsLoader.classList.toggle('hidden', !loading);
    }
    
    showMessage(message, type = 'info') {
        this.messageElement.textContent = message;
        this.messageElement.className = `message ${type}`;
        this.messageElement.style.display = 'block';
        
        // 自动隐藏消息
        setTimeout(() => {
            this.messageElement.style.display = 'none';
        }, 5000);
    }
}

// 快速操作函数
async function quickAction(username, count) {
    const adminManager = window.adminManagerInstance;
    if (!adminManager || !adminManager.adminKey) {
        alert('请先进行管理员身份验证');
        return;
    }
    
    const realUsername = prompt(`请输入要操作的用户名:`, username);
    const realCount = prompt(`请输入要增加的问题次数:`, count);
    
    if (!realUsername || !realCount) return;
    
    try {
        const response = await fetch('/api/admin/update-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminKey: adminManager.adminKey,
                username: realUsername,
                questionsToAdd: parseInt(realCount)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`成功为用户 ${realUsername} 增加 ${realCount} 次提问`);
        } else {
            alert(`操作失败: ${data.message}`);
        }
    } catch (error) {
        alert('网络错误，请重试');
    }
}

async function quickPremium(username, isPremium) {
    const adminManager = window.adminManagerInstance;
    if (!adminManager || !adminManager.adminKey) {
        alert('请先进行管理员身份验证');
        return;
    }
    
    const realUsername = prompt(`请输入要操作的用户名:`, username);
    
    if (!realUsername) return;
    
    try {
        const response = await fetch('/api/admin/update-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminKey: adminManager.adminKey,
                username: realUsername,
                setPremium: isPremium
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const actionText = isPremium ? '设为付费用户' : '取消付费用户';
            alert(`成功${actionText}: ${realUsername}`);
        } else {
            alert(`操作失败: ${data.message}`);
        }
    } catch (error) {
        alert('网络错误，请重试');
    }
}

// 加载用户列表
async function loadUserList() {
    const adminManager = window.adminManagerInstance;
    if (!adminManager || !adminManager.adminKey) {
        alert('请先进行管理员身份验证');
        return;
    }
    
    const userTableBody = document.getElementById('userTableBody');
    const userCount = document.getElementById('userCount');
    
    // 显示加载状态
    userTableBody.innerHTML = '<tr><td colspan="7" class="loading-text">正在加载用户列表...</td></tr>';
    
    try {
        const response = await fetch('/api/admin/get-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminKey: adminManager.adminKey
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayUserList(data.users);
            userCount.textContent = `总用户数：${data.users.length}`;
        } else {
            userTableBody.innerHTML = `<tr><td colspan="7" class="loading-text">加载失败: ${data.message}</td></tr>`;
            userCount.textContent = '总用户数：-';
        }
    } catch (error) {
        console.error('加载用户列表失败:', error);
        userTableBody.innerHTML = '<tr><td colspan="7" class="loading-text">网络错误，请重试</td></tr>';
        userCount.textContent = '总用户数：-';
    }
}

// 显示用户列表
function displayUserList(users) {
    const userTableBody = document.getElementById('userTableBody');
    
    if (users.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="7" class="loading-text">暂无用户数据</td></tr>';
        return;
    }
    
    const rows = users.map(user => {
        const userType = user.is_premium ? 'premium' : 'free';
        const userTypeText = user.is_premium ? '付费用户' : '免费用户';
        
        let questionsDisplay;
        let questionsClass = '';
        
        if (user.is_premium) {
            questionsDisplay = '无限制';
            questionsClass = 'unlimited';
        } else {
            questionsDisplay = user.questions_remaining;
            if (user.questions_remaining <= 0) {
                questionsClass = 'low';
            } else if (user.questions_remaining <= 1) {
                questionsClass = 'medium';
            } else {
                questionsClass = 'high';
            }
        }
        
        const createdDate = new Date(user.created_at).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <tr>
                <td><strong>${escapeHtml(user.username)}</strong></td>
                <td>${user.password_status}</td>
                <td>${user.email || '未填写'}</td>
                <td><span class="questions-remaining ${questionsClass}">${questionsDisplay}</span></td>
                <td><span class="user-status ${userType}">${userTypeText}</span></td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons-inline">
                        <button class="quick-action-btn" onclick="quickAddQuestions('${escapeHtml(user.username)}')">
                            +问题
                        </button>
                        <button class="quick-action-btn premium" onclick="togglePremium('${escapeHtml(user.username)}', ${!user.is_premium})">
                            ${user.is_premium ? '取消付费' : '设为付费'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    userTableBody.innerHTML = rows;
}

// 快速增加问题次数
async function quickAddQuestions(username) {
    const count = prompt(`为用户 "${username}" 增加问题次数:`, '10');
    if (!count || isNaN(count) || parseInt(count) < 1) return;
    
    const adminManager = window.adminManagerInstance;
    if (!adminManager || !adminManager.adminKey) {
        alert('管理员权限验证失败');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/update-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminKey: adminManager.adminKey,
                username: username,
                questionsToAdd: parseInt(count)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`成功为用户 ${username} 增加 ${count} 次提问`);
            loadUserList(); // 刷新列表
        } else {
            alert(`操作失败: ${data.message}`);
        }
    } catch (error) {
        alert('网络错误，请重试');
    }
}

// 切换付费状态
async function togglePremium(username, setPremium) {
    const actionText = setPremium ? '设为付费用户' : '取消付费用户';
    if (!confirm(`确定要${actionText} "${username}" 吗？`)) return;
    
    const adminManager = window.adminManagerInstance;
    if (!adminManager || !adminManager.adminKey) {
        alert('管理员权限验证失败');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/update-questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminKey: adminManager.adminKey,
                username: username,
                setPremium: setPremium
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`成功${actionText}: ${username}`);
            loadUserList(); // 刷新列表
        } else {
            alert(`操作失败: ${data.message}`);
        }
    } catch (error) {
        alert('网络错误，请重试');
    }
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function goBack() {
    window.location.href = 'index.html';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.adminManagerInstance = new AdminManager();
});