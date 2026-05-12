import * as esbuild from "esbuild";
import * as fs from "node:fs";

const mainCode = fs.readFileSync("src/main.ts", "utf8");
const bannerMatch = mainCode.match(/\/\*![\s\S]*?\*\//);
const bannerText = bannerMatch ? bannerMatch[0] : "";

esbuild
    .build({
        entryPoints: ["src/main.ts"],
        bundle: true,
        platform: "neutral",
        format: "iife",
        target: "ES2025",
        legalComments: "none",
        charset: "utf8",
        outfile: "convert.js",
        banner: { js: bannerText },
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
