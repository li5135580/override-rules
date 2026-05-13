/**
 * 默认的 fake-ip 过滤域名列表。
 * 这些域名不会被 fake-ip 机制代理，防止 FakeIP 污染。
 * 涵盖：国内域名、私有地址、连通性检查、STUN/NAT、时间同步、Apple Push 等。
 */
const FAKE_IP_FILTER = [
    "geosite:private",
    "geosite:private",
    "geosite:connectivity-check",
    "geosite:cn",
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
        TLS: {
            ports: [443, 8443],
        },
        HTTP: {
            ports: [80, 8080, 8880],
        },
        QUIC: {
            ports: [443, 8443, 4433],
        },
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
 * 构建 DNS 配置的输入参数类型。
 */
interface BuildDnsConfigInput {
    mode: "redir-host" | "fake-ip";
    ipv6Enabled: boolean;
    fakeIpFilter?: string[];
}

/**
 * 构建 Clash DNS 配置对象。
 * @param {BuildDnsConfigInput} params - 构建参数
 * @param {('redir-host'|'fake-ip')} params.mode - DNS 增强模式
 * @param {boolean} params.ipv6Enabled - 是否启用 IPv6
 * @param {string[]=} params.fakeIpFilter - fake-ip 过滤域名列表（可选）
 * @returns {Record<string, unknown>} DNS 配置对象
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
        ],
        nameserver: [
            "https://doh.pub/dns-query",
            "https://dns.alidns.com/dns-query",
            "tls://dot.pub",
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
 * 构建 DNS 配置的输入参数类型（外部接口）。
 */
export interface BuildDnsInput {
    fakeIPEnabled: boolean;
    ipv6Enabled: boolean;
}

/**
 * 根据 fakeIP 和 IPv6 开关生成最终 DNS 配置。
 * @param {BuildDnsInput} params - 构建参数
 * @param {boolean} params.fakeIPEnabled - 是否启用 fake-ip 模式
 * @param {boolean} params.ipv6Enabled - 是否启用 IPv6
 * @returns {Record<string, unknown>} DNS 配置对象
 */
export function buildDns({ fakeIPEnabled, ipv6Enabled }: BuildDnsInput): Record<string, unknown> {
    if (fakeIPEnabled) {
        return buildDnsConfig({ mode: "fake-ip", ipv6Enabled, fakeIpFilter: FAKE_IP_FILTER });
    }
    return buildDnsConfig({ mode: "redir-host", ipv6Enabled });
}
