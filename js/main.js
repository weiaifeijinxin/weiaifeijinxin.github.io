// 等待文档加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('网页已加载完成');
    
    // 设置当前日期
    const currentDate = document.getElementById('currentDate');
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = today.toLocaleDateString('zh-CN', options);
    
    // 设置日期选择器的最小值为明天
    const receiveDateInput = document.getElementById('receiveDate');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    receiveDateInput.min = tomorrow.toISOString().split('T')[0];

    // 获取所有需要的元素
    const apiButton = document.getElementById('apiButton');
    const apiResult = document.getElementById('apiResult');
    const letterContent = document.getElementById('letterContent');
    const receiverEmail = document.getElementById('receiverEmail');

    // 验证邮箱格式
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // 添加文本框焦点效果
    letterContent.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = '0 0 20px rgba(44, 62, 80, 0.1)';
    });

    letterContent.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    });

    // 添加API配置
    const API_CONFIG = {
        URL: 'http://timepill.api.northcity.top/1/classes/XinList',
        HEADERS: {
            'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
            'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
            'Content-Type': 'application/json'
        }
    };

    // 格式化日期时间
    function formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 创建代理 iframe
    const proxyFrame = document.createElement('iframe');
    proxyFrame.style.display = 'none';
    proxyFrame.src = 'proxy.html';
    document.body.appendChild(proxyFrame);

    // 添加 JSONP 函数
    function jsonp(url, data) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_' + Date.now();
            const script = document.createElement('script');
            
            // 创建查询字符串
            const queryString = Object.entries(data)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');

            // 设置全局回调
            window[callbackName] = function(response) {
                delete window[callbackName];
                document.body.removeChild(script);
                resolve(response);
            };

            // 添加错误处理
            script.onerror = () => {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('JSONP 请求失败'));
            };

            // 构建完整的URL
            script.src = `${url}?callback=${callbackName}&${queryString}`;
            document.body.appendChild(script);
        });
    }

    // 获取模态框相关元素
    const modal = document.getElementById('sendModal');
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.modal-button.cancel');
    const confirmButton = modal.querySelector('.modal-button.confirm');
    const isPublicCheckbox = document.getElementById('isPublic');

    // 在文件开头添加成功弹窗元素引用
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');

    // 获取计数器元素
    const visitCount = document.getElementById('visitCount');
    const letterCount = document.getElementById('letterCount');

    // 记录访问次数
    async function recordVisit() {
        try {
            const response = await fetch('https://api.codenow.cn/1/classes/Statistics', {
                method: 'POST',
                headers: {
                    'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                    'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'visit',
                    timestamp: formatDateTime(new Date())
                })
            });

            if (!response.ok) {
                throw new Error('Failed to record visit');
            }
        } catch (error) {
            console.error('Error recording visit:', error);
        }
    }

    // 获取统计数据
    async function fetchStatistics() {
        try {
            const response = await fetch('https://api.codenow.cn/1/classes/Statistics', {
                headers: {
                    'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                    'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await response.json();
            
            // 更新显示
            const visits = data.results.filter(item => item.type === 'visit').length;
            const letters = data.results.filter(item => item.type === 'letter').length;
            
            updateCounter(visitCount, visits);
            updateCounter(letterCount, letters);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    }

    // 更新计数器显示
    function updateCounter(element, value) {
        element.textContent = value.toLocaleString();
        element.classList.remove('animate');
        void element.offsetWidth; // 触发重排
        element.classList.add('animate');
    }

    // 记录成功发送的信件
    async function recordLetter() {
        try {
            const response = await fetch('https://api.codenow.cn/1/classes/Statistics', {
                method: 'POST',
                headers: {
                    'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                    'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'letter',
                    timestamp: formatDateTime(new Date())
                })
            });

            if (!response.ok) {
                throw new Error('Failed to record letter');
            }

            // 更新统计数据显示
            fetchStatistics();
        } catch (error) {
            console.error('Error recording letter:', error);
        }
    }

    // 初始化：记录访问并获取统计数据
    recordVisit().then(() => fetchStatistics());

    // 修改请求部分
    apiButton.addEventListener('click', function() {
        if (!letterContent.value.trim()) {
            apiResult.textContent = '请先写下您想对未来说的话...';
            apiResult.style.color = '#e74c3c';
            return;
        }

        // 添加背景模糊效果
        document.querySelector('.letter-container').classList.add('blur');
        
        // 显示模态框
        modal.classList.add('show');
        modal.style.display = 'flex';  // 确保模态框显示
        modal.style.opacity = '1';     // 设置透明度
        
        // 设置模态框内容的动画
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            modalContent.style.transform = 'translateY(0)';
            modalContent.style.opacity = '1';
        }, 10);
    });

    // 修改关闭模态框函数
    function closeModal() {
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        modal.querySelector('.modal-content').style.opacity = '0';
        
        setTimeout(() => {
            modal.classList.remove('show');
            // 移除背景模糊效果
            document.querySelector('.letter-container').classList.remove('blur');
        }, 300);
    }

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    // 确认发送
    confirmButton.addEventListener('click', async function() {
        // 验证表单
        if (!receiverEmail.value || !isValidEmail(receiverEmail.value)) {
            alert('请输入有效的邮箱地址');
            return;
        }

        if (!receiveDateInput.value) {
            alert('请选择收信日期');
            return;
        }

        // 准备请求数据
        const requestData = {
            xinContent: letterContent.value,
            xinSendToEmail: receiverEmail.value,
            xinYesOrNoShow: isPublicCheckbox.checked ? 'YES' : 'NO',
            xinSendTime: receiveDateInput.value,
            xinCreateTime: formatDateTime(new Date())
        };

        try {
            // 显示发送状态
            confirmButton.disabled = true;
            confirmButton.textContent = '发送中...';

            // 发送请求
            const response = await fetch('https://api.codenow.cn/1/classes/XinList', {
                method: 'POST',
                headers: {
                    'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                    'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`服务器错误：${response.statusText}`);
            }

            // 记录成功发送的信件
            await recordLetter();

            // 关闭设置弹窗
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
            modal.querySelector('.modal-content').style.opacity = '0';
            
            setTimeout(() => {
                modal.classList.remove('show');
                modal.style.display = 'none';

                // 显示成功弹窗
                const formattedDate = new Date(receiveDateInput.value).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                successMessage.textContent = `您的信件已经成功封存，将在 ${formattedDate} 发送至您的邮箱`;
                
                successModal.style.display = 'flex';
                successModal.classList.add('show');
                
                // 确保动画效果
                setTimeout(() => {
                    successModal.style.opacity = '1';
                    successModal.querySelector('.modal-content').style.transform = 'translateY(0)';
                    successModal.querySelector('.modal-content').style.opacity = '1';
                }, 10);

                // 3秒后自动关闭成功提示
                setTimeout(() => {
                    // 关闭成功弹窗
                    successModal.style.opacity = '0';
                    successModal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
                    successModal.querySelector('.modal-content').style.opacity = '0';
                    
                    setTimeout(() => {
                        successModal.classList.remove('show');
                        successModal.style.display = 'none';
                        // 移除背景模糊效果
                        document.querySelector('.letter-container').classList.remove('blur');

                        // 重置所有表单
                        letterContent.value = '';
                        receiveDateInput.value = '';
                        receiverEmail.value = '';
                        isPublicCheckbox.checked = false;
                        apiResult.textContent = '';
                    }, 300);
                }, 3000);
            }, 300);

        } catch (error) {
            alert('发送失败：' + error.message);
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = '确认发送';
        }
    });

    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    function checkNetworkError(error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return '网络连接失败，请检查您的网络连接';
        }
        if (error.message.includes('NetworkError')) {
            return '网络错误，可能是跨域问题';
        }
        return error.message;
    }
    
    // 点击成功弹窗外部也可以关闭
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.style.opacity = '0';
            successModal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
            successModal.querySelector('.modal-content').style.opacity = '0';
            
            setTimeout(() => {
                successModal.classList.remove('show');
                successModal.style.display = 'none';
                // 移除背景模糊效果
                document.querySelector('.letter-container').classList.remove('blur');
                
                // 重置所有表单
                letterContent.value = '';
                receiveDateInput.value = '';
                receiverEmail.value = '';
                isPublicCheckbox.checked = false;
                apiResult.textContent = '';
            }, 300);
        }
    });
});

function checkNetworkError(error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return '网络连接失败，请检查您的网络连接';
    }
    if (error.message.includes('NetworkError')) {
        return '网络错误，可能是跨域问题';
    }
    return error.message;
} 