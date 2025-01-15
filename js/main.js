// 格式化日期时间函数
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 导出 getStats 函数
async function getStats() {
    try {
        let allResults = [];
        let skip = 0;
        const limit = 100;
        let hasMore = true;

        // 循环获取所有数据
        while (hasMore) {
            const response = await fetch(`https://api.codenow.cn/1/classes/Statistics?limit=${limit}&skip=${skip}`, {
                method: 'GET',
                headers: {
                    'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                    'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('获取统计失败');
            }

            const data = await response.json();
            allResults = allResults.concat(data.results);
            
            // 如果返回的数据少于limit，说明已经没有更多数据了
            if (data.results.length < limit) {
                hasMore = false;
            } else {
                skip += limit; // 增加偏移量，获取下一页数据
            }
        }

        // 更新显示
        const visitCount = document.getElementById('visitCount');
        const letterCount = document.getElementById('letterCount');
        
        if (visitCount) {
            visitCount.textContent = allResults.filter(item => item.type === 'visit').length;
        }
        if (letterCount) {
            letterCount.textContent = allResults.filter(item => item.type === 'letter').length;
        }

    } catch (error) {
        console.error('获取统计数据失败:', error);
    }
}

// 记录访问
async function recordVisit() {
    try {
        const response = await fetch('https://api.codenow.cn/1/classes/Statistics', {
            method: 'POST',
            headers: {
                'X-Bmob-Application-Id': '075c9e426a01a48a81aa12305924e532',
                'X-Bmob-REST-API-Key': 'a92fd1416101a7ee4de0ee0850572b91',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'visit',
                timestamp: formatDateTime(new Date())
            })
        });

        // 添加状态码提示
        const statusMessage = `请求状态: ${response.status} ${response.statusText}`;
        const responseData = await response.json();
        // console.log('访问记录响应:', responseData);
        
        // // 创建提示框
        // const toast = document.createElement('div');
        // toast.style.cssText = `
        //     position: fixed;
        //     bottom: 20px;
        //     left: 50%;
        //     transform: translateX(-50%);
        //     background: rgba(0, 0, 0, 0.7);
        //     color: white;
        //     padding: 10px 20px;
        //     border-radius: 4px;
        //     font-size: 14px;
        //     z-index: 10000;
        //     transition: opacity 0.3s ease;
        // `;
        // toast.textContent = statusMessage;
        // document.body.appendChild(toast);

        // setTimeout(() => {
        //     toast.style.opacity = '0';
        //     setTimeout(() => {
        //         document.body.removeChild(toast);
        //     }, 300);
        // }, 3000);

        if (!response.ok) {
            throw new Error('记录访问失败');
        }

        // 记录成功后获取最新统计
        await getStats();

    } catch (error) {
        console.error('记录访问失败:', error);
        
        // const errorToast = document.createElement('div');
        // errorToast.style.cssText = `
        //     position: fixed;
        //     bottom: 20px;
        //     left: 50%;
        //     transform: translateX(-50%);
        //     background: rgba(255, 0, 0, 0.7);
        //     color: white;
        //     padding: 10px 20px;
        //     border-radius: 4px;
        //     font-size: 14px;
        //     z-index: 10000;
        //     transition: opacity 0.3s ease;
        // `;
        // errorToast.textContent = `请求失败: ${error.message}`;
        // document.body.appendChild(errorToast);

        // setTimeout(() => {
        //     errorToast.style.opacity = '0';
        //     setTimeout(() => {
        //         document.body.removeChild(errorToast);
        //     }, 300);
        // }, 3000);
    }
}

// 页面加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始记录访问...'); // 添加日志
    recordVisit(); // 记录访问
    getStats();    // 获取统计数据
});

// 随机选择邮票图片
document.addEventListener('DOMContentLoaded', function() {
    const stampImg = document.querySelector('.stamp');
    if (stampImg) {
        const randomIndex = Math.floor(Math.random() * 14); // 0-13的随机数
        stampImg.src = `images/youpiao/youpiao${randomIndex}.png`;
    }
}); 