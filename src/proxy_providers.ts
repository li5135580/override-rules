/**
 * 聚合订阅代理集 (Proxy Providers)
 *
 * 在代理客户端本地将 P1_URL / P2_URL 替换为你自己的订阅链接即可。
 */

export const P1_URL = "https://www.baidu.com";
export const P2_URL = "https://www.google.com";

export const proxyProviders = {
    P1: {
        type: "http",
        url: P1_URL,
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
        url: P2_URL,
        path: "./proxy_providers/P2.yaml",
        interval: 3600,
        "health-check": {
            enable: true,
            url: "https://cp.cloudflare.com/generate_204",
            interval: 300,
        },
    },
};

export const PROXY_PROVIDER_NAMES = ["P1", "P2"] as const;
