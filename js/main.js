// 等待文档加载完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('网页已加载完成');
    
    // 获取按钮和结果显示区域
    const apiButton = document.getElementById('apiButton');
    const apiResult = document.getElementById('apiResult');
    const letterContent = document.getElementById('letterContent');

    // 添加按钮点击事件监听器
    apiButton.addEventListener('click', async function() {
        try {
            // 检查信件内容是否为空
            if (!letterContent.value.trim()) {
                apiResult.textContent = '请先写下您想说的话';
                return;
            }

            // 显示加载状态
            apiButton.disabled = true;
            apiButton.textContent = '保存中...';
            apiResult.textContent = '正在保存您的信件...';

            // 这里替换成您实际的API地址
            const response = await fetch('https://api.example.com/save-letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: letterContent.value,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error('保存失败');
            }

            const data = await response.json();
            
            // 显示成功消息
            apiResult.textContent = '您的信件已经成功保存到时间胶囊中';
            // 清空输入框
            letterContent.value = '';

        } catch (error) {
            // 显示错误信息
            apiResult.textContent = '发生错误：' + error.message;
            console.error('API调用错误：', error);
        } finally {
            // 恢复按钮状态
            apiButton.disabled = false;
            apiButton.textContent = '保存信件';
        }
    });
}); 