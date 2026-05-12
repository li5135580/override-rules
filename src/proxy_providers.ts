/**
 * 聚合订阅代理集 (Proxy Providers)
 *
 * P1 和 P2 为两个聚合订阅链接占位符。
 * 在代理客户端本地将 www.baidu.com 和 www.google.com
 * 替换为你自己的订阅链接即可完成节点合并导入。
 */

export const proxyProviders = {
    P1: {
        type: "http",
        url: "https://www.baidu.com",
        path: "./proxy_providers/P1.yaml",
        interval: 3600,
        "health-check": {
            enable: true,
            url: "https://cp.cloudflare.com/generate_204",
            interval: 300,
        },
    },
    P2: {
        type: "http",
        url: "https://www.google.com",
        path: "./proxy_providers/P2.yaml",
        interval: 3600,
        "health-check": {
            enable: true,
            url: "https://cp.cloudflare.com/generate_204",
            interval: 300,
        },
    },
};

/** 代理集名称列表，用于注入 proxy-group 的 `use` 字段 */
export const PROXY_PROVIDER_NAMES = ["P1", "P2"] as const;
