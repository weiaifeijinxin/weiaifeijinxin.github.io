// 配置
const API_CONFIG = {
    domain: 'https://api.codenow.cn',
    tableName: 'XinList',
    appId: '075c9e426a01a48a81aa12305924e532',
    restKey: 'a92fd1416101a7ee4de0ee0850572b91'
};

const limit = 20;
let skip = 0;
let loading = false;
let finished = false;

const mailboxList = document.getElementById('mailbox-list');

async function fetchPageData() {
    if (loading || finished) return;
    loading = true;
    // 显示加载提示
    let loadingDiv = document.getElementById('mailbox-loading');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'mailbox-loading';
        loadingDiv.className = 'loading';
        loadingDiv.textContent = '正在加载信件...';
        mailboxList.appendChild(loadingDiv);
    } else {
        loadingDiv.style.display = 'block';
    }

    const url = `${API_CONFIG.domain}/1/classes/${API_CONFIG.tableName}?limit=${limit}&skip=${skip}&order=-createdAt`;
    const headers = {
        'X-Bmob-Application-Id': API_CONFIG.appId,
        'X-Bmob-REST-API-Key': API_CONFIG.restKey,
        'Content-Type': 'application/json'
    };
    console.log(`[mailbox] 请求:`, url, 'skip:', skip, 'limit:', limit);

    try {
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`请求失败: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (data.results.length === 0) {
            finished = true;
            loadingDiv.textContent = '没有更多信件了';
            return;
        }
        renderMailbox(data.results);
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

function renderMailbox(mails) {
    // 只展示公开信
    const publicMails = mails.filter(mail => mail.xinYesOrNoShow === 'YES');
    if (publicMails.length === 0) {
        mailboxList.innerHTML = '<div class="loading">暂无公开信件</div>';
        return;
    }
    publicMails.forEach(mail => {
        const item = document.createElement('div');
        item.className = 'mail-item';

        // 邮件元信息
        const meta = document.createElement('div');
        meta.className = 'mail-meta';
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

        mailboxList.appendChild(item);
});
}

// 监听滚动事件实现懒加载
function onScrollLoadMore() {
    if (loading || finished) return;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const listBottom = mailboxList.getBoundingClientRect().bottom + scrollY;
    if (scrollY + viewportHeight + 100 >= listBottom) {
        fetchPageData();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    mailboxList.innerHTML = '';
    skip = 0;
    loading = false;
    finished = false;
    fetchPageData();
    window.addEventListener('scroll', onScrollLoadMore);
});