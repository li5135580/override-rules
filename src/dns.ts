/**
 * 强化版 fake-ip 过滤域名列表。
 * 这些域名不会被 fake-ip 机制代理，防止 FakeIP 污染。
 * 覆盖：国内域名、私有地址、连通性检查、STUN/NAT、时间同步、Apple Push、全局外部域名。
 */
const FAKE_IP_FILTER = [
    "geosite:private",
    "geosite:cn",
    "geosite:connectivity-check",
    "geosite:google",
    "geosite:netflix",
    "geosite:telegram",
    "geosite:twitter",
    "geosite:youtube",
    "Mijia Cloud",
    "dig.io.mi.com",
    "localhost.ptlogin2.qq.com",
    "+.push.apple.com",
    "+.icloud.com",
    "+.stun",
    "+.com",
    "+.apple.com",
    "+.cloudflare.com",
    "time.windows.com",
    "+.nist.gov",
    "pool.ntp.org",
    "+.pool.ntp.org",
    "+.msftncsi.com",
    "+.msftconnecttest.com",
];

/**
 * 嗅探器配置。
 * 支持 TLS/HTTP/QUIC 协议嗅探，兼容 Reality/H3 场景。
 */
export const snifferConfig = {
    sniff: {
        TLS: { ports: [443, 8443] },
        HTTP: { ports: [80, 8080, 8880] },
        QUIC: { ports: [443, 8443, 4433, 4434] }, // 增加常见 QUIC 端口防泄露
    },
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    "skip-domain": [
        "Mijia Cloud",
        "dlg.io.mi.com",
        "+.push.apple.com",
        "*.local",
        "courier.push.apple.com",
        "time.*.apple.com",
    ],
};

/**
 * 构建 DNS 配置的输入参数类型
 */
interface BuildDnsConfigInput {
    mode: "redir-host" | "fake-ip";
    ipv6Enabled: boolean;
    fakeIpFilter?: string[];
}

/**
 * 构建 Clash DNS 配置对象
 */
function buildDnsConfig({
    mode,
    ipv6Enabled,
    fakeIpFilter,
}: BuildDnsConfigInput): Record<string, unknown> {
    const config: Record<string, unknown> = {
        enable: true,
        ipv6: ipv6Enabled,
        "prefer-h3": false,
        "enhanced-mode": mode,
        "default-nameserver": [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query",
            "tls://dot.pub",
            "tls://1.1.1.1",
            "tls://8.8.8.8",
        ],
        nameserver: [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query",
            "tls://dot.pub",
            "tls://1.1.1.1",
            "tls://8.8.8.8",
        ],
        fallback: [
            "tls://1.1.1.1",
            "tls://8.8.8.8",
            "https://dns.google/dns-query",
            "https://cloudflare-dns.com/dns-query",
        ],
        "fallback-filter": {
            geoip: true,
            "geoip-code": "CN",
            geosite: ["gfw"],
            ipcidr: ["240.0.0.0/4", "0.0.0.0/32", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
        },
        "nameserver-policy": {
            "geosite:cn,private": [
                "https://doh.pub/dns-query",
                "https://dns.alidns.com/dns-query",
                "223.5.5.5",
            ],
            "geosite:google,netflix,telegram,twitter,youtube": ["tls://8.8.8.8", "tls://1.1.1.1"],
            "geosite:gfw": ["tls://8.8.8.8", "https://dns.google/dns-query"],
        },
        "proxy-server-nameserver": [
            "https://doh.pub/dns-query",
            "tls://1.1.1.1",
            "https://dns.alidns.com/dns-query",
        ],
    };

    if (fakeIpFilter) {
        config["fake-ip-filter"] = fakeIpFilter;
        config["fake-ip-filter-mode"] = "blacklist";
    }

    return config;
}

/**
 * 构建 DNS 配置的外部接口
 */
export interface BuildDnsInput {
    fakeIPEnabled: boolean;
    ipv6Enabled: boolean;
}

/**
 * 生成最终 DNS 配置
 */
export function buildDns({ fakeIPEnabled, ipv6Enabled }: BuildDnsInput): Record<string, unknown> {
    if (fakeIPEnabled) {
        // 强制启用 FakeIP + 全局黑名单
        return buildDnsConfig({
            mode: "fake-ip",
            ipv6Enabled,
            fakeIpFilter: FAKE_IP_FILTER,
        });
    }
    // Redir-Host 模式，也可以保证 IPv4/IPv6 请求走代理
    return buildDnsConfig({
        mode: "redir-host",
        ipv6Enabled,
    });
}
