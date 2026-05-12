/**
 * 聚合订阅代理集 (Proxy Providers)
 *
 * P1 和 P2 为两个聚合订阅链接占位符。
 * 将下方的 url 替换为你自己的订阅链接后，
 * Mihomo 内核会自动拉取并将节点合并导入对应分组。
 *
 * 替换方法：全局搜索 YOUR_SUBSCRIPTION_LINK_P1 和 YOUR_SUBSCRIPTION_LINK_P2，
 * 替换为你的实际订阅 URL 即可。
 */

export const proxyProviders = {
    P1: {
        type: "http",
        url: "https://YOUR_SUBSCRIPTION_LINK_P1_HERE",
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
        url: "https://YOUR_SUBSCRIPTION_LINK_P2_HERE",
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
