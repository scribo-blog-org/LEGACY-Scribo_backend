const Session = require('../models/Session')
const { REFRESH_TTL_MS } = require('../models/Session')

async function createSession(data) {
    const session = await Session.create(data)
    return session.toObject()
}

async function getSessionById(id) {
    return Session.findById(id).lean()
}

async function getSessionsByUserId(userId) {
    await Session.deleteMany({
        user: userId,
        expiresAt: { $lte: new Date() }
    })

    return Session.find({
        user: userId,
        expiresAt: { $gt: new Date() }
    })
        .sort({ lastSeen: -1 })
        .select('-refreshTokenHash')
        .lean()
}

async function updateSessionById(id, data) {
    return Session.findByIdAndUpdate(id, data, { new: true }).lean()
}

async function deleteSessionById(id) {
    return Session.findByIdAndDelete(id).lean()
}

async function deleteExpiredSessions() {
    return Session.deleteMany({ expiresAt: { $lte: new Date() } })
}

module.exports = {
    createSession,
    getSessionById,
    getSessionsByUserId,
    updateSessionById,
    deleteSessionById,
    deleteExpiredSessions,
    REFRESH_TTL_MS
}
