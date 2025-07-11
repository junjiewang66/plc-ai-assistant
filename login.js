class AuthManager {
    constructor() {
        this.baseUrl = '';
        this.initializeElements();
        this.bindEvents();
        this.checkExistingAuth();
    }
    
    initializeElements() {
        // 标签页按钮
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        
        // 表单元素
        this.loginFormElement = document.getElementById('loginFormElement');
        this.registerFormElement = document.getElementById('registerFormElement');
        
        // 登录表单
        this.loginUsername = document.getElementById('loginUsername');
        this.loginPassword = document.getElementById('loginPassword');
        this.loginBtnText = document.getElementById('loginBtnText');
        this.loginLoader = document.getElementById('loginLoader');
        
        // 注册表单
        this.registerUsername = document.getElementById('registerUsername');
        this.registerPassword = document.getElementById('registerPassword');
        this.confirmPassword = document.getElementById('confirmPassword');
        this.email = document.getElementById('email');
        this.registerBtnText = document.getElementById('registerBtnText');
        this.registerLoader = document.getElementById('registerLoader');
        
        // 消息显示
        this.messageElement = document.getElementById('message');
    }
    
    bindEvents() {
        // 标签页切换
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 表单提交
        this.loginFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        this.registerFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // 密码确认验证
        this.confirmPassword.addEventListener('input', () => {
            this.validatePasswordMatch();
        });
    }
    
    switchTab(tab) {
        // 更新标签页状态
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // 显示对应表单
        this.loginForm.classList.toggle('hidden', tab !== 'login');
        this.registerForm.classList.toggle('hidden', tab !== 'register');
        
        // 清除消息
        this.clearMessage();
    }
    
    validatePasswordMatch() {
        const password = this.registerPassword.value;
        const confirmPwd = this.confirmPassword.value;
        
        if (confirmPwd && password !== confirmPwd) {
            this.confirmPassword.setCustomValidity('密码不匹配');
        } else {
            this.confirmPassword.setCustomValidity('');
        }
    }
    
    async handleLogin() {
        const username = this.loginUsername.value.trim();
        const password = this.loginPassword.value;
        
        if (!username || !password) {
            this.showMessage('请填写用户名和密码', 'error');
            return;
        }
        
        this.setLoginLoading(true);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 保存令牌
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showMessage('登录成功！正在跳转...', 'success');
                
                // 跳转到主页面
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showMessage('网络连接错误，请重试', 'error');
        }
        
        this.setLoginLoading(false);
    }
    
    async handleRegister() {
        const username = this.registerUsername.value.trim();
        const password = this.registerPassword.value;
        const confirmPwd = this.confirmPassword.value;
        const email = this.email.value.trim();
        
        // 验证输入
        if (!username || !password || !confirmPwd) {
            this.showMessage('请填写所有必填字段', 'error');
            return;
        }
        
        if (username.length < 3) {
            this.showMessage('用户名至少需要3个字符', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('密码至少需要6个字符', 'error');
            return;
        }
        
        if (password !== confirmPwd) {
            this.showMessage('两次输入的密码不匹配', 'error');
            return;
        }
        
        this.setRegisterLoading(true);
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username, 
                    password, 
                    email: email || null 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('注册成功！请登录', 'success');
                
                // 清空注册表单
                this.registerFormElement.reset();
                
                // 切换到登录页面
                setTimeout(() => {
                    this.switchTab('login');
                }, 1500);
            } else {
                this.showMessage(data.message, 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showMessage('网络连接错误，请重试', 'error');
        }
        
        this.setRegisterLoading(false);
    }
    
    checkExistingAuth() {
        const token = localStorage.getItem('token');
        if (token) {
            // 验证令牌是否有效
            fetch('/api/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 令牌有效，直接跳转到主页面
                    window.location.href = 'index.html';
                } else {
                    // 令牌无效，清除本地存储
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            })
            .catch(error => {
                console.error('验证令牌错误:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            });
        }
    }
    
    setLoginLoading(loading) {
        const btn = this.loginFormElement.querySelector('.auth-btn');
        btn.disabled = loading;
        this.loginBtnText.classList.toggle('hidden', loading);
        this.loginLoader.classList.toggle('hidden', !loading);
    }
    
    setRegisterLoading(loading) {
        const btn = this.registerFormElement.querySelector('.auth-btn');
        btn.disabled = loading;
        this.registerBtnText.classList.toggle('hidden', loading);
        this.registerLoader.classList.toggle('hidden', !loading);
    }
    
    showMessage(message, type = 'info') {
        this.messageElement.textContent = message;
        this.messageElement.className = `message ${type}`;
        this.messageElement.style.display = 'block';
        
        // 3秒后自动隐藏成功消息
        if (type === 'success') {
            setTimeout(() => {
                this.clearMessage();
            }, 3000);
        }
    }
    
    clearMessage() {
        this.messageElement.style.display = 'none';
        this.messageElement.className = 'message';
        this.messageElement.textContent = '';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});