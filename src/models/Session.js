const { Schema, model, Types } = require('mongoose');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const schema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true },
    device: { type: String, required: true, default: 'Unknown device' },
    location: { type: String, required: true, default: 'Unknown' },
    ip: { type: String, required: false },
    lastSeen: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true }
}, { timestamps: true })

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = model('Session', schema);
module.exports.REFRESH_TTL_MS = REFRESH_TTL_MS;
