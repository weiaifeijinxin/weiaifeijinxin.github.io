/**
 * Cloudflare Worker - HTTPS 代理转发到 HTTP 后端
 * 
 * 部署步骤：
 * 1. 注册/登录 Cloudflare（https://dash.cloudflare.com）
 * 2. 左侧菜单选择 "Workers & Pages"
 * 3. 点击 "Create Worker"
 * 4. 将此文件的代码粘贴进去，点击 "Deploy"
 * 5. 部署后会得到一个 URL，如：https://timepill-proxy.你的用户名.workers.dev
 * 6. 将该 URL 替换到前端代码的 API_CONFIG 中
 */

const BACKEND_URL = 'http://timepill.api.northcity.top';

// 允许的前端域名（防止被滥用）
const ALLOWED_ORIGINS = [
  'https://weiaifeijinxin.github.io',
  'http://localhost',
  'http://127.0.0.1',
];

function isOriginAllowed(origin) {
  if (!origin) return true; // 允许无 origin 的请求（如 curl）
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Bmob-Application-Id, X-Bmob-REST-API-Key',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin');

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // 来源检查
    if (!isOriginAllowed(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // 构建目标 URL：将 Worker 的路径转发到后端
      const url = new URL(request.url);
      const targetUrl = BACKEND_URL + url.pathname + url.search;

      // 转发请求头
      const headers = new Headers();
      for (const [key, value] of request.headers.entries()) {
        if (['x-bmob-application-id', 'x-bmob-rest-api-key', 'content-type'].includes(key.toLowerCase())) {
          headers.set(key, value);
        }
      }

      // 转发请求
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: ['GET', 'HEAD'].includes(request.method) ? null : await request.text(),
      });

      // 返回响应并添加 CORS 头
      const responseHeaders = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        responseHeaders.set(key, value);
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      });
    }
  },
};
