const cookie = require("cookie")

const REFRESH_COOKIE = "refresh_token"
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

function cookieOptions() {
    return {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: MAX_AGE_MS
    }
}

function getRefreshCookies(req) {
    const header = req.headers.cookie || ""
    const tokens = []

    for (const part of header.split(";")) {
        const index = part.indexOf("=")
        if (index === -1) {
            continue
        }

        const name = part.slice(0, index).trim()
        if (name !== REFRESH_COOKIE) {
            continue
        }

        let value = part.slice(index + 1).trim()
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1)
        }

        try {
            value = decodeURIComponent(value)
        }
        catch {
            // keep raw value
        }

        if (value) {
            tokens.push(value)
        }
    }

    return tokens.reverse()
}

function getRefreshCookie(req) {
    const tokens = getRefreshCookies(req)
    return tokens[tokens.length - 1] || null
}

function clearStaleRefreshCookies(res) {
    const variants = [
        { path: "/api/auth", sameSite: "lax", secure: false },
        { path: "/api/auth", sameSite: "lax", secure: true },
        { path: "/api/auth", sameSite: "none", secure: true },
        { path: "/", sameSite: "lax", secure: false },
        { path: "/", sameSite: "lax", secure: true }
    ]

    for (const variant of variants) {
        res.clearCookie(REFRESH_COOKIE, {
            httpOnly: true,
            ...variant
        })
    }
}

function setRefreshCookie(res, token) {
    clearStaleRefreshCookies(res)
    res.cookie(REFRESH_COOKIE, token, cookieOptions())
}

function clearRefreshCookie(res) {
    clearStaleRefreshCookies(res)
    res.clearCookie(REFRESH_COOKIE, cookieOptions())
}

module.exports = {
    REFRESH_COOKIE,
    getRefreshCookie,
    getRefreshCookies,
    setRefreshCookie,
    clearRefreshCookie
}
