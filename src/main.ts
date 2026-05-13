/*!
powerfullz 的 Substore 订阅转换脚本
https://github.com/powerfullz/override-rules

============================================================
  🔴 多订阅聚合占位符 - 在本地代理客户端搜索替换变量值即可
============================================================
  P1_URL = "https://www.baidu.com"   →  替换为订阅链接1
  P2_URL = "https://www.google.com"  →  替换为订阅链接2
============================================================

支持的传入参数：
- loadbalance: 启用负载均衡（url-test/load-balance，默认 false）
- landing: 启用落地节点功能（如机场家宽/星链/落地分组，默认 false）
- ipv6: 启用 IPv6 支持（默认 false）
- full: 输出完整配置（适合纯内核启动，默认 false）
- keepalive: 启用 tcp-keep-alive（默认 false）
- fakeip: DNS 使用 FakeIP 模式（默认 true，false 为 RedirHost）
- quic: 允许 QUIC 流量（UDP 443，默认 false）
- threshold: 地区节点数量小于该值时不显示分组 (默认 0)
- regex: 使用正则过滤模式（include-all + filter）写入各地区代理组，而非直接枚举节点名称（默认 false）

源码说明：
- 源码已迁移至 `src/*.ts` 文件，使用 TypeScript 编写，编译后输出到 `dist/*.js`。
*/

import { CDN_URL, NODE_SUFFIX, PROXY_GROUPS } from "./constants";
import { buildFeatureFlags } from "./args";
import { buildCountryProxyGroups, buildProxyGroups } from "./proxy_groups";
import {
    getCountryGroupNames,
    parseCountries,
    parseLowCost,
    parseNodesByLanding,
    stripNodeSuffix,
} from "./node_parser";
import { proxyProviders, PROXY_PROVIDER_NAMES } from "./proxy_providers";
import { buildRules } from "./rules";
import { ruleProviders } from "./rule_providers";
import { buildDns, snifferConfig } from "./dns";
import { buildBaseLists } from "./selectors";
import type { ClashConfig, ScriptArgs } from "./types";

const geoxURL = {
    geoip: `${CDN_URL}/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat`,
    geosite: `${CDN_URL}/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat`,
    mmdb: `${CDN_URL}/gh/Loyalsoldier/geoip@release/Country.mmdb`,
    asn: `${CDN_URL}/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb`,
};

declare const $arguments: ScriptArgs;

function getRawArgs(): ScriptArgs {
    try {
        return $arguments;
    } catch {
        console.log("[powerfullz 的覆写脚本] 未检测到传入参数，使用默认参数。", {});
        return {};
    }
}

const rawArgs = getRawArgs();
const {
    loadBalance,
    landing,
    ipv6Enabled,
    fullConfig,
    keepAliveEnabled,
    fakeIPEnabled,
    quicEnabled,
    regexFilter,
    countryThreshold,
} = buildFeatureFlags(rawArgs);

function main(config: ClashConfig): ClashConfig {
    const resultConfig: ClashConfig = { proxies: config.proxies };

    const countryInfo = parseCountries(resultConfig, landing);
    const lowCostNodes = parseLowCost(resultConfig);
    const countryGroupNames = getCountryGroupNames(countryInfo, countryThreshold);
    const countries = stripNodeSuffix(countryGroupNames);

    const { landingNodes, nonLandingNodes } = landing
        ? parseNodesByLanding(resultConfig)
        : { landingNodes: [], nonLandingNodes: [] };

    const {
        defaultProxies,
        defaultProxiesDirect,
        defaultSelector,
        defaultFallback,
        frontProxySelector,
    } = buildBaseLists({
        landing,
        lowCostNodes,
        countryGroupNames,
        nonLandingNodes,
        regexFilter,
    });

    const countryProxyGroups = buildCountryProxyGroups({
        countries,
        landing,
        loadBalance,
        regexFilter,
        countryInfo,
    });

    const proxyGroups = buildProxyGroups({
        landing,
        regexFilter,
        countries,
        countryProxyGroups,
        lowCostNodes,
        landingNodes,
        defaultProxies,
        defaultProxiesDirect,
        defaultSelector,
        defaultFallback,
        frontProxySelector,
    });

    const globalProxies = proxyGroups.map((item) => String(item.name));
    proxyGroups.push({
        name: PROXY_GROUPS.GLOBAL,
        icon: `${CDN_URL}/gh/Koolson/Qure@master/IconSet/Color/Global.png`,
        "include-all": true,
        type: "select",
        proxies: globalProxies,
    });

    for (const group of proxyGroups) {
        const name = String(group.name);
        if (
            name === PROXY_GROUPS.SELECT ||
            name === PROXY_GROUPS.MANUAL ||
            name === PROXY_GROUPS.AUTO ||
            name === PROXY_GROUPS.FALLBACK ||
            name === PROXY_GROUPS.LOW_COST ||
            name.endsWith(NODE_SUFFIX)
        ) {
            group.use = [...PROXY_PROVIDER_NAMES];
        }
    }

    const finalRules = buildRules({ quicEnabled });

    if (fullConfig) {
        Object.assign(resultConfig, {
            "mixed-port": 7890,
            "redir-port": 7892,
            "tproxy-port": 7893,
            "routing-mark": 7894,
            "allow-lan": true,
            "bind-address": "*",
            ipv6: ipv6Enabled,
            mode: "rule",
            "unified-delay": true,
            "tcp-concurrent": true,
            "tcp-keep-alive-idle": 600,
            "tcp-keep-alive-interval": 30,
            "tcp-fast-open": true,
            "find-process-mode": "off",
            "log-level": "info",
            "geodata-loader": "standard",
            "external-controller": ":9999",
            "disable-keep-alive": !keepAliveEnabled,
            profile: {
                "store-selected": true,
            },
            tun: {
                enable: true,
                stack: "mixed",
                "dns-hijack": ["any:53", "tcp://any:53", "tcp://any:853"],
                "auto-route": true,
                "auto-detect-interface": true,
                "strict-route": true,
            },
        });
    }

    Object.assign(resultConfig, {
        "proxy-providers": proxyProviders,
        "proxy-groups": proxyGroups,
        "rule-providers": ruleProviders,
        rules: finalRules,
        sniffer: snifferConfig,
        dns: buildDns({ fakeIPEnabled, ipv6Enabled }),
        "geodata-mode": true,
        "geox-url": geoxURL,
    });

    return resultConfig;
}

(globalThis as Record<string, unknown>).main = main;
