const jwt = require("jsonwebtoken")

const ACCESS_TTL = "15m"
const REFRESH_TTL = "30d"

function accessKey() {
    return process.env.JWTKEY
}

function refreshKey() {
    return process.env.JWT_REFRESH_KEY || `${process.env.JWTKEY}-refresh`
}

function encodeAccess(user, sessionId) {
    const payload = {
        id: String(user._id),
        email: user.email,
        role: user.role,
        nick_name: user.nick_name
    }

    if (sessionId) {
        payload.sessionId = String(sessionId)
    }

    return jwt.sign(
        payload,
        accessKey(),
        { expiresIn: ACCESS_TTL }
    )
}

function encodeRefresh({ userId, sessionId }) {
    return jwt.sign(
        {
            id: String(userId),
            sessionId: String(sessionId),
            tokenType: "refresh"
        },
        refreshKey(),
        { expiresIn: REFRESH_TTL }
    )
}

function decodeAccess(token) {
    try {
        const decoded = jwt.verify(token, accessKey());

        if (decoded?.tokenType === "refresh" || decoded?.typ === "refresh") {
            return null
        }

        const id = decoded?.id || decoded?.user_id

        if (!id || !decoded.role) {
            return null
        }

        return {
            id: String(id),
            email: decoded.email || null,
            role: decoded.role,
            nick_name: decoded.nick_name || null,
            sessionId: decoded.sessionId ? String(decoded.sessionId) : null
        }
    }
    catch (err) {
        return null
    }
}

function peekAccess(token) {
    const verified = decodeAccess(token)

    if (verified) {
        return verified
    }

    try {
        const decoded = jwt.decode(token)

        if (!decoded || decoded.tokenType === "refresh" || decoded.typ === "refresh") {
            return null
        }

        const id = decoded.id || decoded.user_id

        if (!id) {
            return null
        }

        return {
            id: String(id),
            email: decoded.email || null,
            role: decoded.role || null,
            nick_name: decoded.nick_name || null,
            sessionId: decoded.sessionId ? String(decoded.sessionId) : null
        }
    }
    catch {
        return null
    }
}

function decode(token) {
    return decodeAccess(token)?.id || null
}

function decodeRefresh(token) {
    try {
        const decoded = jwt.verify(token, refreshKey());

        if (!decoded?.id || !decoded?.sessionId) {
            return null
        }

        if (decoded.tokenType !== "refresh" && decoded.typ !== "refresh") {
            return null
        }

        return decoded
    }
    catch (err) {
        return null
    }
}

module.exports = {
    encodeAccess,
    encodeRefresh,
    decodeAccess,
    decode,
    decodeRefresh,
    peekAccess
}
