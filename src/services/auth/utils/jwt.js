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
            role: user.role
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

function decode(token) {
    try {
        const decoded = jwt.verify(token, accessKey());

        if (decoded?.tokenType === "refresh") {
            return null
        }

        if (decoded?.id) {
            return decoded.id
        }

        if (decoded?.user_id) {
            return decoded.user_id
        }

        return null
    }
    catch (err) {
        return null
    }
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
    decode,
    decodeRefresh
}
