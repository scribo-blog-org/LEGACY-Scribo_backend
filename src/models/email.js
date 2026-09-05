const {Schema, model} = require('mongoose');

let schema = new Schema({
    email: { type: String, required: true, index: true },
    purpose: { type: String, default: "register", index: true },
    code: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
})

module.exports = model('EmailVerificationCode', schema, "email_verification_codes");