const crypto = require("crypto")
const { Types } = require("mongoose")

const UnAuthorizedError = require("../../errors/UnAuthorizedError")
const NotFoundError = require("../../errors/NotFoundError")

const { encodeAccess, encodeRefresh, decodeRefresh, peekAccess } = require("./utils/jwt")
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
const { clientIp, lookupVisitorGeo, formatLocation } = require("../geo")
const { parseDevice } = require("../device")

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex")
}

async function issueSession(user, req) {
    const geo = await lookupVisitorGeo(req, req.body)
    const ip = geo.ip || clientIp(req)
    const device = parseDevice(req.headers["user-agent"])
    const location = formatLocation(geo, "Unknown")
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
        accessToken: encodeAccess(user, sessionId),
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
    const sessionIds = new Set()

    for (const token of getRefreshCookies(req)) {
        const payload = decodeRefresh(token)

        if (payload?.sessionId) {
            sessionIds.add(String(payload.sessionId))
        }
    }

    const header = req.headers.authorization
    const access = req.auth || (header ? peekAccess(header.split(" ")[1] || "") : null)

    if (access?.sessionId) {
        sessionIds.add(String(access.sessionId))
    }

    for (const sessionId of sessionIds) {
        await deleteSessionById(sessionId)
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

        const geo = await lookupVisitorGeo(req, req.body)
        const patch = { lastSeen: new Date() }

        if (geo.city || geo.country) {
            patch.location = formatLocation(geo, session.location)
            patch.ip = geo.ip || session.ip
        }

        await updateSessionById(session._id, patch)

        return {
            accessToken: encodeAccess(user, session._id),
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
