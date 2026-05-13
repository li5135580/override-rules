/**
 * Fake-IP 过滤域名列表。
 * 列入的域名使用真实 DNS 解析，不走 Fake-IP，
 * 防止连通性检测/STUN/NTP/ApplePush 等服务被 FakeIP 污染。
 */
const FAKE_IP_FILTER = [
    "geosite:private",
    "geosite:cn",
    "geosite:connectivity-check",
    "Mijia Cloud",
    "dig.io.mi.com",
    "localhost.ptlogin2.qq.com",
    "+.push.apple.com",
    "*.icloud.com",
    "+.stun.*.*",
    "+.stun.*.*.*",
    "+.stun.*.*.*.*",
    "time.*.com",
    "time.*.apple.com",
    "time.*.cloudflare.com",
    "time.windows.com",
    "ntp.*.com",
    "time.nist.gov",
    "pool.ntp.org",
    "+.pool.ntp.org",
    "+.msftncsi.com",
    "+.msftconnecttest.com",
];

/**
 * 嗅探器配置。
 * TLS/HTTP/QUIC 全覆盖，兼容 Reality/H3。
 * PC 端和 Android 端通用。
 */
export const snifferConfig = {
    sniff: {
        TLS: { ports: [443, 8443] },
        HTTP: { ports: [80, 8080, 8880] },
        QUIC: { ports: [443, 8443, 4433, 4434] },
    },
    enable: true,
    "force-dns-mapping": true,
    "parse-pure-ip": true,
    "override-destination": false,
    "skip-domain": [
        "Mijia Cloud",
        "dlg.io.mi.com",
        "+.push.apple.com",
        "courier.push.apple.com",
        "time.*.apple.com",
    ],
};

interface BuildDnsConfigInput {
    mode: "redir-host" | "fake-ip";
    ipv6Enabled: boolean;
    fakeIpFilter?: string[];
}

function buildDnsConfig({
    mode,
    ipv6Enabled,
    fakeIpFilter,
}: BuildDnsConfigInput): Record<string, unknown> {
    const config: Record<string, unknown> = {
        enable: true,
        ipv6: ipv6Enabled,
        "prefer-h3": true,
        "enhanced-mode": mode,
        // 仅用于解析 nameserver/fallback 中 DoH/DoT 的域名，用纯 UDP 最快
        "default-nameserver": ["223.5.5.5", "119.29.29.29", "180.184.1.1"],
        // 日常 DNS：国内 DoH/DoT 优先，UDP 兜底（兼顾 Android 弱网）
        nameserver: [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query",
            "tls://dot.pub",
            "223.5.5.5",
        ],
        // 海外 DNS：触发 fallback-filter 时使用
        fallback: [
            "tls://8.8.8.8",
            "tls://1.1.1.1",
            "https://dns.google/dns-query",
            "https://cloudflare-dns.com/dns-query",
        ],
        "fallback-filter": {
            geoip: true,
            "geoip-code": "CN",
            geosite: ["gfw"],
            ipcidr: ["240.0.0.0/4"],
        },
        "nameserver-policy": {
            // 国内域名走国内 DNS，防投毒
            "geosite:cn,private": [
                "https://doh.pub/dns-query",
                "https://dns.alidns.com/dns-query",
                "223.5.5.5",
            ],
            // 常见海外服务强制走海外 DNS 防 DNS 污染
            "geosite:google,netflix,telegram,twitter,youtube,github": [
                "tls://8.8.8.8",
                "tls://1.1.1.1",
            ],
            "geosite:gfw": ["tls://8.8.8.8", "https://dns.google/dns-query"],
        },
        // 代理节点自身的 DNS
        "proxy-server-nameserver": [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query",
            "tls://1.1.1.1",
        ],
    };

    if (fakeIpFilter) {
        config["fake-ip-filter"] = fakeIpFilter;
        config["fake-ip-filter-mode"] = "blacklist";
    }

    return config;
}

export interface BuildDnsInput {
    fakeIPEnabled: boolean;
    ipv6Enabled: boolean;
}

export function buildDns({ fakeIPEnabled, ipv6Enabled }: BuildDnsInput): Record<string, unknown> {
    if (fakeIPEnabled) {
        return buildDnsConfig({ mode: "fake-ip", ipv6Enabled, fakeIpFilter: FAKE_IP_FILTER });
    }
    return buildDnsConfig({ mode: "redir-host", ipv6Enabled });
}
