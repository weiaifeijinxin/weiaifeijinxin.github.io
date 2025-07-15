let lastScrollTime = 0;
let scrollLock = false;
// 配置

const API_CONFIG = {
    domain: 'https://api.codenow.cn',
    appId: '075c9e426a01a48a81aa12305924e532',
    restKey: 'a92fd1416101a7ee4de0ee0850572b91',
    table: {
        future: 'XinList',
        image: 'XinListWithImage',
        shqs: 'UserSHQSPost'
    }
};

let currentTab = 'future';


const limit = 20;
let skip = 0;
let loading = false;
let finished = false;

const mailboxList = document.getElementById('mailbox-list');
const tabBtns = document.querySelectorAll('.tab-btn');

async function fetchPageData() {
    if (loading || finished) return;
    loading = true;
    // 显示加载提示
    let loadingDiv = document.getElementById('mailbox-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'mailbox-loading';
        loadingDiv.className = 'loading loading-bottom';
        loadingDiv.textContent = '正在加载信件...';
        mailboxList.appendChild(loadingDiv);
    } else {
        loadingDiv.style.display = 'block';
        loadingDiv.textContent = '正在加载信件...';
        // 保证loadingDiv在列表底部
        if (mailboxList.lastElementChild !== loadingDiv) {
            mailboxList.appendChild(loadingDiv);
        }
    }

    const tableName = API_CONFIG.table[currentTab];
    const url = `${API_CONFIG.domain}/1/classes/${tableName}?limit=${limit}&skip=${skip}&order=-createdAt`;
    const headers = {
        'X-Bmob-Application-Id': API_CONFIG.appId,
        'X-Bmob-REST-API-Key': API_CONFIG.restKey,
        'Content-Type': 'application/json'
    };
    console.log(`[mailbox] 请求:`, url, 'skip:', skip, 'limit:', limit, 'tab:', currentTab);

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.results.length === 0) {
            finished = true;
            loadingDiv.textContent = '没有更多信件了';
            return;
        }
        // 判断是否为首次加载
        const isFirstLoad = skip === 0;
        renderMailbox(data.results, !isFirstLoad);
        skip += data.results.length;
        if (data.results.length < limit) {
            finished = true;
            loadingDiv.textContent = '没有更多信件了';
        } else {
            loadingDiv.style.display = 'none';
        }
    } catch (e) {
        loadingDiv.textContent = '加载失败，请稍后重试。';
        console.error('[mailbox] 拉取信件失败:', e);
    } finally {
        loading = false;
    }
}

function maskEmail(email) {
    if (!email || typeof email !== 'string') return '未知';
    const atIdx = email.indexOf('@');
    if (atIdx <= 1) return '***' + email.slice(atIdx);
    const name = email.slice(0, atIdx);
    let masked = '';
    if (name.length <= 2) {
        masked = name[0] + '***';
    } else {
        masked = name[0] + '***' + name[name.length - 1];
    }
    return masked + email.slice(atIdx);
}

function formatDateToDay(dateStr) {
    if (!dateStr) return '';
    // 兼容 ISO 格式和 yyyy-mm-dd hh:mm:ss
    const d = new Date(dateStr.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}


function getRandomStampUrl() {
    // 使用绝对路径，适配所有页面和手机端
    return window.location.origin + '/images/youpiao/youpiao' + Math.floor(Math.random() * 14) + '.png';
}

// 渲染信件，支持追加模式
function renderMailbox(mails, append = false) {
    if (!append) mailboxList.innerHTML = '';
    if (currentTab === 'future') {
        // 只展示公开信
        const publicMails = mails.filter(mail => mail.xinYesOrNoShow === 'YES');
        if (!append && publicMails.length === 0) {
            mailboxList.innerHTML = '<div class="loading">暂无公开信件</div>';
            return;
        }
        publicMails.forEach(mail => {
            const item = document.createElement('div');
            item.className = 'mail-item';
            // 小邮票
            const stamp = document.createElement('img');
            stamp.src = getRandomStampUrl();
            stamp.alt = '邮票';
            stamp.style.position = 'absolute';
            stamp.style.left = '10px';
            stamp.style.top = '10px';
            stamp.style.width = '38px';
            stamp.style.height = '38px';
            stamp.style.borderRadius = '6px';
            stamp.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
            item.appendChild(stamp);
            // 邮件元信息
            const meta = document.createElement('div');
            meta.className = 'mail-meta';
            meta.style.marginLeft = '50px';
            meta.textContent = `收信邮箱：${maskEmail(mail.xinSendToEmail)}　收信日期：未来某天　寄信时间：${formatDateToDay(mail.xinCreateTime || mail.createdAt || '')}`;
            item.appendChild(meta);
            // 邮件内容
            const content = document.createElement('div');
            content.className = 'mail-content';
            content.textContent = mail.xinContent || '';
            item.appendChild(content);
            // 是否公开
            if (mail.xinYesOrNoShow === 'YES') {
                const pub = document.createElement('div');
                pub.className = 'mail-public';
                pub.textContent = '公开';
                item.appendChild(pub);
            }
            item.style.position = 'relative';
            mailboxList.appendChild(item);
        });
    } else if (currentTab === 'image' || currentTab === 'shqs') {
        if (!append && !mails.length) {
            mailboxList.innerHTML = `<div class=\"loading\">${currentTab === 'image' ? '暂无图片信件' : '暂无三行情书'}</div>`;
            return;
        }
        mails.forEach(mail => {
            const item = document.createElement('div');
            item.className = 'mail-item';
            item.style.position = 'relative';
            // 小邮票
            const stamp = document.createElement('img');
            stamp.src = getRandomStampUrl();
            stamp.alt = '邮票';
            stamp.style.position = 'absolute';
            stamp.style.left = '10px';
            stamp.style.top = '10px';
            stamp.style.width = '38px';
            stamp.style.height = '38px';
            stamp.style.borderRadius = '6px';
            stamp.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
            item.appendChild(stamp);
            // 顶部元信息
            const meta = document.createElement('div');
            meta.className = 'mail-meta';
            meta.style.marginLeft = '50px';
            const recvEmail = maskEmail(mail.xinSendToEmail || mail.xinemail || '');
            const recvDate = (currentTab === 'image') ? '未来某天' : (mail.xinSendTime ? formatDateToDay(mail.xinSendTime) : (mail.xinReceiveDate ? formatDateToDay(mail.xinReceiveDate) : '未来某天'));
            const sendDate = formatDateToDay(mail.xinCreateTime || mail.createdAt || '');
            meta.textContent = `收信邮箱：${recvEmail}　收信日期：${recvDate}　寄信时间：${sendDate}`;
            item.appendChild(meta);
            // 图片展示
            let imgUrl = '';
            if (currentTab === 'shqs') {
                imgUrl = mail.xinimageurl || mail.image || '';
            } else {
                imgUrl = mail.xinimageurl || mail.image || '';
            }
            if (imgUrl) {
                // 兼容绝对/相对路径
                if (!/^https?:\/\//.test(imgUrl) && !imgUrl.startsWith('/')) {
                    imgUrl = window.location.origin + '/' + imgUrl.replace(/^\/*/, '');
                } else if (imgUrl.startsWith('/')) {
                    imgUrl = window.location.origin + imgUrl;
                }
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = currentTab === 'image' ? '定格时空图片' : '三行情书图片';
                img.style.maxWidth = '100%';
                img.style.borderRadius = '10px';
                img.style.marginBottom = '12px';
                item.appendChild(img);
            }
            // 内容
            if (mail.xinContent) {
                if (currentTab === 'shqs') {
                    // 三行情书样式
                    const quoteBox = document.createElement('div');
                    quoteBox.className = 'shqs-quote-box';
                    quoteBox.innerHTML = `
                        <span class="shqs-quote-mark">“</span>
                        <span class="shqs-quote-content">${mail.xinContent.replace(/\n/g, '<br>')}</span>
                        <span class="shqs-quote-mark">”</span>
                    `;
                    item.appendChild(quoteBox);
                } else {
                    const content = document.createElement('div');
                    content.className = 'mail-content';
                    content.textContent = mail.xinContent;
                    item.appendChild(content);
                }
            }
            // 公开标记
            if (mail.xinYesOrNoShow === 'YES' || mail.isPublic === true) {
                const pub = document.createElement('div');
                pub.className = 'mail-public';
                pub.textContent = '公开';
                item.appendChild(pub);
            }
            mailboxList.appendChild(item);
        });
    }
}

// 监听滚动事件实现懒加载
function onScrollLoadMore() {
    if (loading || finished || scrollLock) return;
    const now = Date.now();
    if (now - lastScrollTime < 600) return; // 节流，600ms内只触发一次
    lastScrollTime = now;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const listBottom = mailboxList.getBoundingClientRect().bottom + scrollY;
    if (scrollY + viewportHeight + 100 >= listBottom) {
        scrollLock = true;
        fetchPageData().finally(() => {
            setTimeout(() => { scrollLock = false; }, 600);
        });
    }
}


// tab切换逻辑
function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;
    skip = 0;
    finished = false;
    loading = false;
    mailboxList.innerHTML = '';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
    fetchPageData();
}

document.addEventListener('DOMContentLoaded', function() {
    mailboxList.innerHTML = '';
    skip = 0;
    loading = false;
    finished = false;
    fetchPageData();
    window.addEventListener('scroll', onScrollLoadMore);
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
});