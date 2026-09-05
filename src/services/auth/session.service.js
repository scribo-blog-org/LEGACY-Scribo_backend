const crypto = require("crypto")
const { Types } = require("mongoose")

const UnAuthorizedError = require("../../errors/UnAuthorizedError")
const NotFoundError = require("../../errors/NotFoundError")

const { encodeAccess, encodeRefresh, decodeRefresh } = require("./utils/jwt")
const { getRefreshCookies } = require("./utils/cookies")
const {
    createSession,
    getSessionById,
    getSessionsByUserId,
    updateSessionById,
    deleteSessionById,
    deleteExpiredSessions,
    REFRESH_TTL_MS
} = require("../../db/sessions.db")
const { getUserById } = require("../../db/users.db")
const { clientIp, resolveLocation } = require("../geo")

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

function parseDevice(userAgent = "") {
    if (!userAgent) {
        return "Неизвестное устройство"
    }

    let browser = "Браузер"
    if (userAgent.includes("Edg/")) browser = "Edge"
    else if (userAgent.includes("Chrome/")) browser = "Chrome"
    else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) browser = "Safari"
    else if (userAgent.includes("Firefox/")) browser = "Firefox"

    let os = ""
    if (userAgent.includes("Android")) os = "Android"
    else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS"
    else if (userAgent.includes("Mac OS")) os = "macOS"
    else if (userAgent.includes("Windows")) os = "Windows"
    else if (userAgent.includes("Linux")) os = "Linux"

    return os ? `${browser} · ${os}` : browser
}

async function issueSession(user, req) {
    const ip = clientIp(req)
    const device = parseDevice(req.headers["user-agent"])
    const location = await resolveLocation(ip)
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
    const sessionId = new Types.ObjectId()
    const refreshToken = encodeRefresh({
        userId: user._id,
        sessionId
    })

    await createSession({
        _id: sessionId,
        user: user._id,
        refreshTokenHash: hashToken(refreshToken),
        device,
        location,
        ip,
        lastSeen: new Date(),
        expiresAt
    })

    return {
        accessToken: encodeAccess(user),
        refreshToken
    }
}

async function getCurrentRefreshPayload(req) {
    for (const token of getRefreshCookies(req)) {
        const payload = decodeRefresh(token)
        if (payload) {
            return payload
        }
    }

    return null
}

async function logoutSession(req) {
    for (const token of getRefreshCookies(req)) {
        const payload = decodeRefresh(token)
        if (payload?.sessionId) {
            await deleteSessionById(payload.sessionId)
        }
    }
}

async function refreshSession(req) {
    await deleteExpiredSessions()

    const tokens = getRefreshCookies(req)

    if (tokens.length === 0) {
        throw new UnAuthorizedError({ message: "Refresh token is missing" })
    }

    let lastError = "Refresh token is invalid"

    for (const token of tokens) {
        const payload = decodeRefresh(token)

        if (!payload) {
            continue
        }

        const session = await getSessionById(payload.sessionId)

        if (!session || String(session.user) !== String(payload.id)) {
            lastError = "Session is not found"
            continue
        }

        if (session.expiresAt <= new Date()) {
            await deleteSessionById(session._id)
            lastError = "Session has expired"
            continue
        }

        if (session.refreshTokenHash !== hashToken(token)) {
            lastError = "Refresh token is invalid"
            continue
        }

        const user = await getUserById(session.user)

        if (!user) {
            await deleteSessionById(session._id)
            lastError = "User is not found"
            continue
        }

        await updateSessionById(session._id, {
            lastSeen: new Date()
        })

        return {
            accessToken: encodeAccess(user),
            refreshToken: token
        }
    }

    throw new UnAuthorizedError({ message: lastError })
}

async function listUserSessions(profile, req) {
    const sessions = await getSessionsByUserId(profile._id)
    const current = await getCurrentRefreshPayload(req)
    const currentId = current?.sessionId ? String(current.sessionId) : null

    return sessions.map((session) => ({
        _id: session._id,
        device: session.device,
        location: session.location,
        ip: session.ip,
        lastSeen: session.lastSeen,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isCurrent: currentId === String(session._id)
    }))
}

async function revokeSession(profile, sessionId, req) {
    const session = await getSessionById(sessionId)

    if (!session) {
        throw new NotFoundError({ message: "Session is not found" })
    }

    if (String(session.user) !== String(profile._id)) {
        throw new NotFoundError({ message: "Session is not found" })
    }

    await deleteSessionById(sessionId)

    const current = await getCurrentRefreshPayload(req)

    return {
        wasCurrent: current?.sessionId && String(current.sessionId) === String(sessionId)
    }
}

module.exports = {
    issueSession,
    refreshSession,
    logoutSession,
    listUserSessions,
    revokeSession
}
