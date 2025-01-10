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

    // 添加Bmob的配置
    const BMOB_CONFIG = {
        APPLICATION_ID: 'Your Application ID',  // 替换为您的Application ID
        REST_API_KEY: 'Your REST API Key',      // 替换为您的REST API Key
        API_BASE_URL: 'https://自己备案域名'    // 替换为您的域名
    };

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

            // 使用Bmob API保存数据
            const response = await fetch(`${BMOB_CONFIG.API_BASE_URL}/1/classes/TimeCapsule`, {
                method: 'POST',
                headers: {
                    'X-Bmob-Application-Id': BMOB_CONFIG.APPLICATION_ID,
                    'X-Bmob-REST-API-Key': BMOB_CONFIG.REST_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: letterContent.value,
                    receiveDate: receiveDateInput.value,
                    receiverEmail: receiverEmail.value,
                    sendDate: new Date().toISOString(),
                    status: 'pending',  // 添加状态字段，用于标记是否已发送
                    isRead: false       // 添加阅读状态字段
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '信件封存失败');
            }

            const data = await response.json();
            
            // 格式化日期显示
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

        } catch (error) {
            apiResult.textContent = '发生错误：' + error.message;
            apiResult.style.color = '#e74c3c';
            console.error('API调用错误：', error);
        } finally {
            apiButton.disabled = false;
            apiButton.innerHTML = '<span class="button-text">封存信件</span><span class="button-icon">✉</span>';
        }
    });
}); 