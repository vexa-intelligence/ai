import { UA, SECURITY_CONSTANTS, API_KEYS } from "../config.js";

export const proxyCache = new Map();

export async function getProxyUrl(id, env) {
    if (env?.PROXY_CACHE) {
        return await env.PROXY_CACHE.get(id);
    }
    return proxyCache.get(id);
}

export async function setProxyUrl(id, url, env) {
    if (env?.PROXY_CACHE) {
        await env.PROXY_CACHE.put(id, url, { expirationTtl: 86400 });
    } else {
        proxyCache.set(id, url);
    }
}

export function randomString(n) {
    const chars = SECURITY_CONSTANTS.RANDOM_STRING_CHARS;
    let s = "";
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}

export async function reversedMd5(str) {
    const encoded = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("MD5", encoded);
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .split("")
        .reverse()
        .join("");
}

export function makeClientToken() {
    const obj = {
        bR6wF: { nV5kP: UA, lQ9jX: "en-US", sD2zR: "1920x1080", tY4hL: "America/New_York", pL8mC: "Win32", cQ3vD: 24, hK7jN: 8 },
        uT4bX: { mM9wZ: [], kP8jY: [] },
        tuTcS: Math.floor(Date.now() / 1000),
        tDfxy: null,
        RtyJt: randomString(36),
    };
    return randomString(6) + btoa(JSON.stringify(obj));
}

export async function generateImageKey() {
    const rnd = String(Math.round(Math.random() * 100000000000));
    const h1 = await reversedMd5(UA + rnd + SECURITY_CONSTANTS.HACKER_SECRET);
    const h2 = await reversedMd5(UA + h1);
    const h3 = await reversedMd5(UA + h2);
    return `tryit-${rnd}-${h3}`;
}

export async function makeProxyId(url, env) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(url));
    const id = btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "")
        .slice(0, 32);
    await setProxyUrl(id, url, env);
    return id;
}

export function buildDeepAIImageBody(prompt, modelVer, prefKey) {
    const boundary = API_KEYS.DEEPAI_IMAGE_BOUNDARY;
    const fields = { text: prompt, image_generator_version: modelVer, generation_source: "img" };
    if (prefKey === "turbo") fields.turbo = "true";
    else fields.quality = "true";
    let body = "";
    for (const [name, val] of Object.entries(fields)) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${val}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    return { boundary, body: new TextEncoder().encode(body) };
}