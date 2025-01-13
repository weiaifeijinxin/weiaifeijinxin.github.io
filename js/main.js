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
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // 添加CORS相关头部
            'Access-Control-Allow-Origin': '*'
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

    // 按钮点击事件
    apiButton.addEventListener('click', async function() {
        try {
            // 验证所有必填项
            if (!letterContent.value.trim()) {
                apiResult.textContent = '请先写下您想对未来说的话...';
                apiResult.style.color = '#e74c3c';
                return;
            }

            if (!receiveDateInput.value) {
                apiResult.textContent = '请选择收信日期';
                apiResult.style.color = '#e74c3c';
                return;
            }

            if (!receiverEmail.value || !isValidEmail(receiverEmail.value)) {
                apiResult.textContent = '请输入有效的邮箱地址';
                apiResult.style.color = '#e74c3c';
                return;
            }

            apiButton.disabled = true;
            apiButton.innerHTML = '<span class="button-text">正在封存</span><span class="button-icon">📨</span>';
            apiResult.textContent = '正在将您的信件封存到时间胶囊中...';
            apiResult.style.color = '#666';

            // 准备请求数据
            const requestData = {
                xinContent: letterContent.value,
                xinSendToEmail: receiverEmail.value,
                xinYesOrNoShow: "NO",
                xinSendTime: receiveDateInput.value,
                xinCreateTime: formatDateTime(new Date())
            };

            console.log('Sending request with data:', requestData); // 调试日志

            try {
                const response = await fetch(API_CONFIG.URL, {
                    method: 'POST',
                    headers: API_CONFIG.HEADERS,
                    body: JSON.stringify(requestData),
                    mode: 'cors', // 明确指定跨域模式
                    credentials: 'omit' // 不发送cookies
                });

                console.log('Response status:', response.status); // 调试日志

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Response data:', data); // 调试日志

                if (data.error) {
                    throw new Error(data.error);
                }

                // 格式化显示日期
                const formattedDate = new Date(receiveDateInput.value).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                apiResult.textContent = `您的信件已经成功封存，将在 ${formattedDate} 发送至您的邮箱`;
                apiResult.style.color = '#27ae60';
                
                // 清空表单
                letterContent.value = '';
                receiveDateInput.value = '';
                receiverEmail.value = '';

            } catch (fetchError) {
                console.error('Fetch error:', fetchError); // 调试日志
                throw new Error(`请求失败: ${fetchError.message}`);
            }

        } catch (error) {
            console.error('Error details:', error); // 调试日志
            apiResult.textContent = '发生错误：' + (error.message || '网络请求失败，请稍后重试');
            apiResult.style.color = '#e74c3c';
        } finally {
            apiButton.disabled = false;
            apiButton.innerHTML = '<span class="button-text">封存信件</span><span class="button-icon">✉</span>';
        }
    });
}); 