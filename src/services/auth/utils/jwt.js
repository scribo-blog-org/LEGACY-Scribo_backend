const jwt = require("jsonwebtoken")

const ACCESS_TTL = "15m"
const REFRESH_TTL = "30d"

function accessKey() {
    return process.env.JWTKEY
}

function refreshKey() {
    return process.env.JWT_REFRESH_KEY || `${process.env.JWTKEY}-refresh`
}

function encodeAccess(user) {
    return jwt.sign(
        {
            id: String(user._id),
            email: user.email,
            role: user.role,
            nick_name: user.nick_name
        },
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
            nick_name: decoded.nick_name || null
        }
    }
    catch (err) {
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
    decodeRefresh
}
