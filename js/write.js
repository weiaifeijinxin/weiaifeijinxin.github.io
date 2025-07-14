document.addEventListener('DOMContentLoaded', function() {
    // 先获取所有需要的元素
    const letterContent = document.getElementById('letterContent');
    const receiverEmail = document.getElementById('receiverEmail');
    const receiveDateInput = document.getElementById('receiveDate');
    const isPublicCheckbox = document.getElementById('isPublic');

    // 草稿缓存 key
    const DRAFT_KEY = 'letter_draft';

    // 恢复草稿
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
        try {
            const draft = JSON.parse(savedDraft);
            if (draft.content && letterContent) letterContent.value = draft.content;
            if (draft.receiverEmail && receiverEmail) receiverEmail.value = draft.receiverEmail;
            if (draft.receiveDate && receiveDateInput) receiveDateInput.value = draft.receiveDate;
            if (typeof draft.isPublic === 'boolean' && isPublicCheckbox) isPublicCheckbox.checked = draft.isPublic;
        } catch(e) { /* ignore */ }
    }

    // 自动保存草稿
    function saveDraft() {
        const draft = {
            content: letterContent ? letterContent.value : '',
            receiverEmail: receiverEmail ? receiverEmail.value : '',
            receiveDate: receiveDateInput ? receiveDateInput.value : '',
            isPublic: isPublicCheckbox ? isPublicCheckbox.checked : false
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
    if (letterContent) letterContent.addEventListener('input', saveDraft);
    if (receiverEmail) receiverEmail.addEventListener('input', saveDraft);
    if (receiveDateInput) receiveDateInput.addEventListener('input', saveDraft);
    if (isPublicCheckbox) isPublicCheckbox.addEventListener('change', saveDraft);

    // 发送成功后清除草稿
    function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
    }

    // 设置当前日期
    const currentDate = document.getElementById('currentDate');
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = today.toLocaleDateString('zh-CN', options);
    
    // 设置日期选择器的最小值为明天
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    receiveDateInput.min = tomorrow.toISOString().split('T')[0];

    // 获取所有需要的元素
    const apiButton = document.getElementById('apiButton');
    const apiResult = document.getElementById('apiResult');
    const modal = document.getElementById('sendModal');
    const closeButton = modal.querySelector('.close-button');
    const cancelButton = modal.querySelector('.modal-button.cancel');
    const confirmButton = modal.querySelector('.modal-button.confirm');
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');

    // API配置
    const API_CONFIG = {
        URL: 'https://api.codenow.cn/1/classes/XinList',
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
        modal.classList.add('show');
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0)';
        }, 10);
        document.querySelector('.letter-container').classList.add('blur');
    }

    // 关闭模态框
    function closeModal() {
        modal.style.opacity = '0';
        modal.classList.remove('show');
        modal.querySelector('.modal-content').style.transform = 'translateY(-50px)';
        setTimeout(() => {
            modal.style.display = 'none';
            document.querySelector('.letter-container').classList.remove('blur');
        }, 300);
    }

    // 显示成功弹窗
    function showSuccessModal(message) {
        successMessage.textContent = message;
        clearDraft(); // 清除草稿
        successModal.style.display = 'flex';
        successModal.classList.add('show');
        setTimeout(() => {
            successModal.style.opacity = '1';
            successModal.querySelector('.modal-content').style.transform = 'translateY(0)';
            
            // 3秒后自动关闭
            setTimeout(() => {
                closeSuccessModal();
            }, 3000);
        }, 10);
        document.querySelector('.letter-container').classList.add('blur');
    }

    // 添加关闭成功弹窗的函数
    function closeSuccessModal() {
        successModal.style.opacity = '0';
        successModal.classList.remove('show');
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

    // 添加文本框焦点效果
    letterContent.addEventListener('focus', function() {
        this.parentElement.style.boxShadow = '0 0 20px rgba(44, 62, 80, 0.1)';
    });

    letterContent.addEventListener('blur', function() {
        this.parentElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    });

    // 封存信件按钮点击事件
    apiButton.addEventListener('click', function() {
        if (!letterContent.value.trim()) {
            alert('请输入信件内容');
            return;
        }
        openModal(); // 直接打开弹窗
    });

    // 添加网络错误检查函数
    function checkNetworkError(error) {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return '网络连接失败，请检查您的网络连接';
        }
        if (error.message.includes('NetworkError')) {
            return '网络错误，可能是跨域问题';
        }
        return error.message;
    }

    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);

    // 添加加载状态显示
    function showLoading(button, text = '处理中...') {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = text;
        button.classList.add('loading');
    }

    function hideLoading(button) {
        button.disabled = false;
        button.textContent = button.dataset.originalText;
        button.classList.remove('loading');
    }

    // 优化错误提示
    function showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.textContent = message;
        document.body.appendChild(errorToast);

        setTimeout(() => {
            errorToast.classList.add('show');
            setTimeout(() => {
                errorToast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(errorToast);
                }, 300);
            }, 3000);
        }, 100);
    }

    // 确认发送按钮点击事件
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
            // 发送信件内容
            const response = await fetch(API_CONFIG.URL, {
                method: 'POST',
                headers: API_CONFIG.HEADERS,
                body: JSON.stringify({
                    xinContent: letterContent.value,
                    xinSendToEmail: email,
                    xinYesOrNoShow: isPublicCheckbox.checked ? 'YES' : 'NO',
                    xinSendTime: receiveDate,
                    xinCreateTime: formatDateTime(new Date())
                })
            });

            if (!response.ok) {
                throw new Error('发送失败');
            }

            closeModal();
            showSuccessModal(`信件已成功封存，将在 ${receiveDate} 发送至邮箱：${email}`);

            // 发信成功后，单独记录次数
            fetch('https://api.codenow.cn/1/classes/Statistics', {
                method: 'POST',
                headers: {
                    'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                    'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'letter',
                    timestamp: formatDateTime(new Date())
                })
            }).catch(error => {
                console.error('记录信件统计失败:', error);
            });

        } catch (error) {
            alert('发送失败：' + error.message);
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = '确认发送';
        }
    });
});