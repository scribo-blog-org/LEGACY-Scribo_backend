const Session = require('../models/Session')
const { REFRESH_TTL_MS } = require('../models/Session')

let uniqueUserIndexChecked = false

async function dropUniqueUserIndex() {
    if (uniqueUserIndexChecked) {
        return
    }

    uniqueUserIndexChecked = true

    try {
        const indexes = await Session.collection.indexes()
        for (const index of indexes) {
            const keys = Object.keys(index.key || {})
            if (index.unique && keys.length === 1 && keys[0] === 'user') {
                await Session.collection.dropIndex(index.name)
            }
        }
    }
    catch {
        uniqueUserIndexChecked = false
    }
}

async function createSession(data) {
    await dropUniqueUserIndex()
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

async function deleteSessionsByUserId(userId) {
    return Session.deleteMany({ user: userId })
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
    deleteSessionsByUserId,
    deleteExpiredSessions,
    REFRESH_TTL_MS
}
