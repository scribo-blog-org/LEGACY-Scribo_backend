const geoCache = new Map()

function normalizeIp(raw) {
    const value = String(raw || "").trim()

    if (!value) {
        return ""
    }

    if (value.startsWith("::ffff:")) {
        return value.slice(7)
    }

    return value.split("%")[0]
}

function clientIp(req) {
    const headers = req?.headers || {}

    return firstPublicIp(
        headers["cf-connecting-ip"],
        headers["true-client-ip"],
        headers["x-real-ip"],
        headers["x-forwarded-for"],
        req?.ip,
        req?.socket?.remoteAddress
    )
}

function firstPublicIp(...candidates) {
    const privateFallback = []

    for (const raw of candidates) {
        if (!raw) {
            continue
        }

        for (const part of String(raw).split(",")) {
            const ip = normalizeIp(part)

            if (!ip) {
                continue
            }

            if (!isPrivateIp(ip)) {
                return ip
            }

            privateFallback.push(ip)
        }
    }

    return privateFallback[0] || ""
}

function isPrivateIp(ip) {
    const normalized = normalizeIp(ip)

    if (!normalized || normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost") {
        return true
    }

    if (normalized.startsWith("10.") || normalized.startsWith("192.168.")) {
        return true
    }

    if (normalized.startsWith("172.")) {
        const second = Number(normalized.split(".")[1])
        return second >= 16 && second <= 31
    }

    return false
}

async function fetchGeo(url) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "scribo-session" }
    })
    clearTimeout(timer)

    if (!response.ok) {
        return null
    }

    return response.json()
}

function fromIpwho(data, ip) {
    if (!data?.success) {
        return null
    }

    return {
        ip: ip || data.ip || "",
        city: data.city || "",
        region: data.region || "",
        country: data.country || ""
    }
}

function fromIpapi(data, ip) {
    if (!data || data.error) {
        return null
    }

    const city = data.city || ""
    const country = data.country_name || data.country || ""
    const region = data.region || ""

    if (!city && !country) {
        return null
    }

    return {
        ip: ip || data.ip || "",
        city,
        region,
        country
    }
}

async function lookupGeo(ip, options = {}) {
    const address = normalizeIp(ip)
    const allowEgress = Boolean(options.allowEgress)
    const cacheKey = isPrivateIp(address)
        ? (allowEgress ? "public-egress" : `private:${address || "none"}`)
        : address

    if (geoCache.has(cacheKey)) {
        return {
            ...geoCache.get(cacheKey),
            ip: address || geoCache.get(cacheKey).ip
        }
    }

    if (isPrivateIp(address) && !allowEgress) {
        const empty = {
            ip: address,
            city: "",
            region: "",
            country: ""
        }
        geoCache.set(cacheKey, empty)
        return empty
    }

    const urls = isPrivateIp(address)
        ? ["https://ipwho.is/", "https://ipapi.co/json/"]
        : [
            `https://ipwho.is/${encodeURIComponent(address)}`,
            `https://ipapi.co/${encodeURIComponent(address)}/json/`
        ]

    try {
        for (const url of urls) {
            const data = await fetchGeo(url)
            const result = url.includes("ipwho")
                ? fromIpwho(data, address)
                : fromIpapi(data, address)

            if (result) {
                geoCache.set(cacheKey, result)
                return result
            }
        }
    }
    catch {
        // fallback below
    }

    const fallback = {
        ip: address,
        city: "",
        region: "",
        country: ""
    }
    geoCache.set(cacheKey, fallback)
    return fallback
}

function sanitizePlace(value) {
    return String(value || "").replace(/[<>]/g, "").trim().slice(0, 80)
}

function clientGeoHint(body) {
    const city = sanitizePlace(body?.city)
    const region = sanitizePlace(body?.region)
    const country = sanitizePlace(body?.country)
    const hintIp = normalizeIp(body?.ip)

    if (!city && !country) {
        return null
    }

    return {
        ip: isPrivateIp(hintIp) ? "" : hintIp,
        city,
        region,
        country
    }
}

async function lookupVisitorGeo(req, body) {
    const ip = clientIp(req)
    const hint = clientGeoHint(body)

    if (hint) {
        return {
            ip: hint.ip || ip,
            city: hint.city,
            region: hint.region,
            country: hint.country
        }
    }

    if (!isPrivateIp(ip)) {
        return lookupGeo(ip)
    }

    const hintIp = normalizeIp(body?.ip)

    if (!isPrivateIp(hintIp)) {
        return lookupGeo(hintIp)
    }

    return lookupGeo(ip)
}

function formatLocation(geo, fallback) {
    const parts = [geo?.city, geo?.country].filter(Boolean)

    if (parts.length) {
        return [...new Set(parts)].join(", ")
    }

    return fallback
}

async function resolveLocation(ip) {
    const geo = await lookupGeo(ip, { allowEgress: true })

    return formatLocation(geo, isPrivateIp(ip) ? "Unknown" : (normalizeIp(ip) || "Unknown"))
}

module.exports = {
    clientIp,
    isPrivateIp,
    lookupGeo,
    lookupVisitorGeo,
    resolveLocation,
    formatLocation
}
