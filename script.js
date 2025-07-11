class PLCAIAssistant {
    constructor() {
        this.apiKey = 'sk-111a4f87af724cd4b3a9c3e6bc8f85ab';
        this.baseUrl = 'https://api.deepseek.com';
        this.isResponding = false;
        this.timer = null;
        this.timerSeconds = 0;
        
        this.checkAuthentication();
        this.initializeElements();
        this.bindEvents();
        this.loadUserInfo();
    }
    
    initializeElements() {
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.sendText = document.getElementById('sendText');
        this.sendLoader = document.getElementById('sendLoader');
        this.responseTimer = document.getElementById('responseTimer');
        this.timerDisplay = document.getElementById('timerDisplay');
    }
    
    bindEvents() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message || this.isResponding) return;
        
        // Check if asking about AI model
        if (this.isAskingAboutModel(message)) {
            this.addUserMessage(message);
            this.addAssistantMessage('我是一个专门为解决PLC编程问题而研发的AI编程工具。');
            this.userInput.value = '';
            return;
        }
        
        // Check if question is PLC-related
        if (!this.isPLCRelated(message)) {
            this.addUserMessage(message);
            this.addAssistantMessage('抱歉，我只能回答PLC编程相关的问题。请问您有什么PLC编程方面的问题需要帮助吗？');
            this.userInput.value = '';
            return;
        }
        
        // 检查问题次数
        const canAsk = await this.checkQuestionLimit();
        if (!canAsk) {
            return; // checkQuestionLimit 方法会处理错误消息和跳转
        }
        
        this.addUserMessage(message);
        this.userInput.value = '';
        
        await this.getAIResponse(message);
    }
    
    isAskingAboutModel(message) {
        const modelKeywords = ['哪个AI', '什么AI', '什么模型', 'AI模型', '哪个模型', '什么系统', '基于什么', '用的什么'];
        return modelKeywords.some(keyword => message.includes(keyword));
    }
    
    isPLCRelated(message) {
        const plcKeywords = [
            'PLC', 'plc', '可编程逻辑控制器', '可编程控制器',
            '梯形图', '指令表', '功能块', 'FB', 'FC', 'OB',
            '西门子', 'SIEMENS', '三菱', 'MITSUBISHI', '欧姆龙', 'OMRON',
            'Step7', 'TIA', 'GX Works', 'CX-Programmer',
            '模拟量', '数字量', 'IO', 'I/O', '输入输出',
            '传感器', '执行器', '变频器', '触摸屏', 'HMI',
            '通信', '以太网', 'Profibus', 'Profinet', 'Modbus',
            '程序', '编程', '逻辑', '控制', '自动化',
            '定时器', '计数器', '比较', '运算',
            'LD', 'LDI', 'AND', 'ANI', 'OR', 'ORI', 'OUT', 'SET', 'RST',
            'MOV', 'ADD', 'SUB', 'MUL', 'DIV', 'CMP',
            '工业', '自动化', '控制系统', '生产线'
        ];
        
        return plcKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
    }
    
    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                ${this.escapeHtml(message)}
            </div>
        `;
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addAssistantMessage(message, isStreaming = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (isStreaming) {
            contentDiv.innerHTML = '<span class="typing-cursor"></span>';
        } else {
            contentDiv.textContent = message;
        }
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return contentDiv;
    }
    
    async getAIResponse(userMessage) {
        this.setLoading(true);
        this.startTimer();
        
        const assistantMessageContent = this.addAssistantMessage('', true);
        let responseText = '';
        
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个专业的PLC编程助手。请用中文回答用户关于PLC编程的问题，包括但不限于：梯形图编程、指令表、功能块编程、PLC品牌（西门子、三菱、欧姆龙等）、通信协议、硬件配置、故障诊断等。请提供详细、准确和实用的技术指导。'
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;
                        
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                responseText += content;
                                this.updateStreamingMessage(assistantMessageContent, responseText);
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
            
            // 移除打字光标
            this.finalizeMessage(assistantMessageContent, responseText);
            
        } catch (error) {
            console.error('API请求错误:', error);
            this.finalizeMessage(assistantMessageContent, '抱歉，网络连接出现问题，请稍后重试。');
        }
        
        this.setLoading(false);
        this.stopTimer();
    }
    
    updateStreamingMessage(element, text) {
        element.innerHTML = this.escapeHtml(text) + '<span class="typing-cursor"></span>';
        this.scrollToBottom();
    }
    
    finalizeMessage(element, text) {
        element.innerHTML = this.formatMessage(text);
        this.scrollToBottom();
    }
    
    formatMessage(text) {
        // 简单的格式化：代码块和换行
        return this.escapeHtml(text)
            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setLoading(loading) {
        this.isResponding = loading;
        this.sendButton.disabled = loading;
        this.sendText.classList.toggle('hidden', loading);
        this.sendLoader.classList.toggle('hidden', !loading);
    }
    
    startTimer() {
        this.timerSeconds = 0;
        this.responseTimer.classList.remove('hidden');
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timerSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.responseTimer.classList.add('hidden');
    }
    
    updateTimerDisplay() {
        this.timerDisplay.textContent = this.timerSeconds;
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 10);
    }
    
    checkAuthentication() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        // 验证令牌
        fetch('/api/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('验证令牌错误:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
    
    loadUserInfo() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userWelcome = document.getElementById('userWelcome');
        const logoutBtn = document.getElementById('logoutBtn');
        const upgradeBtn = document.getElementById('upgradeBtn');
        
        if (user.username) {
            userWelcome.textContent = `欢迎，${user.username}`;
        }
        
        logoutBtn.addEventListener('click', () => {
            this.logout();
        });
        
        upgradeBtn.addEventListener('click', () => {
            window.location.href = 'upgrade.html';
        });
        
        // 加载问题次数状态
        this.updateQuestionStatus();
    }
    
    async updateQuestionStatus() {
        const token = localStorage.getItem('token');
        const questionStatus = document.getElementById('questionStatus');
        const upgradeBtn = document.getElementById('upgradeBtn');
        
        try {
            const response = await fetch('/api/check-questions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (data.isPremium) {
                    questionStatus.textContent = '无限制提问';
                    questionStatus.style.background = 'rgba(76, 175, 80, 0.3)';
                    upgradeBtn.classList.add('hidden');
                } else {
                    questionStatus.textContent = `剩余问题：${data.questionsRemaining}`;
                    if (data.questionsRemaining <= 0) {
                        questionStatus.style.background = 'rgba(244, 67, 54, 0.3)';
                        upgradeBtn.classList.remove('hidden');
                    } else if (data.questionsRemaining <= 1) {
                        questionStatus.style.background = 'rgba(255, 193, 7, 0.3)';
                        upgradeBtn.classList.remove('hidden');
                    } else {
                        questionStatus.style.background = 'rgba(255, 255, 255, 0.1)';
                    }
                }
            }
        } catch (error) {
            console.error('获取问题状态失败:', error);
            questionStatus.textContent = '状态未知';
        }
    }
    
    async checkQuestionLimit() {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('/api/use-question', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 更新问题状态显示
                this.updateQuestionStatus();
                return true;
            } else if (data.needUpgrade) {
                this.addAssistantMessage('您的免费提问次数已用完。要继续使用，请升级到完整版。点击右上角"升级账户"按钮了解详情。');
                this.updateQuestionStatus();
                return false;
            } else {
                this.addAssistantMessage('提问失败，请稍后重试。');
                return false;
            }
        } catch (error) {
            console.error('检查问题次数失败:', error);
            this.addAssistantMessage('网络错误，请稍后重试。');
            return false;
        }
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new PLCAIAssistant();
});