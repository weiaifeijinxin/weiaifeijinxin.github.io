document.addEventListener('DOMContentLoaded', function() {
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
    const modal = document.getElementById('sendModal');
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.modal-button.cancel');
    const confirmButton = modal.querySelector('.modal-button.confirm');
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');
    const isPublicCheckbox = document.getElementById('isPublic');

    // API配置
    const API_CONFIG = {
        URL: 'http://timepill.api.northcity.top/1/classes/XinList',
        HEADERS: {
            'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
            'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
            'Content-Type': 'application/json'
        }
    };

    // 验证邮箱格式
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

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

    // 打开模态框
    function openModal() {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
        document.querySelector('.letter-container').classList.add('blur');
    }

    // 关闭模态框
    function closeModal() {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        setTimeout(() => {
            modal.style.display = 'none';
            document.querySelector('.letter-container').classList.remove('blur');
        }, 300);
    }

    // 显示成功弹窗
    function showSuccessModal(message) {
        successMessage.textContent = message;
        successModal.style.display = 'flex';
        setTimeout(() => {
            successModal.style.opacity = '1';
            successModal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
        document.querySelector('.letter-container').classList.add('blur');
    }

    // 事件监听
    apiButton.addEventListener('click', function() {
        if (!letterContent.value.trim()) {
            alert('请输入信件内容');
            return;
        }
        openModal();
    });

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    confirmButton.addEventListener('click', async function() {
        const email = receiverEmail.value;
        const receiveDate = receiveDateInput.value;

        if (!email || !isValidEmail(email)) {
            alert('请输入有效的邮箱地址');
            return;
        }

        if (!receiveDate) {
            alert('请选择收信日期');
            return;
        }

        confirmButton.disabled = true;
        confirmButton.textContent = '发送中...';

        try {
            const response = await fetch(API_CONFIG.URL, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    content: letterContent.value,
                    email: email,
                    receiveDate: receiveDate,
                    isPublic: isPublicCheckbox.checked,
                    sendDate: formatDateTime(new Date())
                })
            });

            if (!response.ok) {
                throw new Error('发送失败');
            }

            closeModal();
            showSuccessModal('信件已成功封存，将在指定日期发送至您的邮箱');

            // 记录信件发送
            await fetch(API_CONFIG.URL, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    type: 'letter',
                    timestamp: formatDateTime(new Date())
                })
            });

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

    // 点击成功弹窗外部也可以关闭
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            successModal.style.opacity = '0';
            successModal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
            
            setTimeout(() => {
                successModal.style.display = 'none';
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