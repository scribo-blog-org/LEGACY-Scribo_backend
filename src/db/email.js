const EmailVerificationCode = require("../models/email")

function emailFilter(email, purpose) {
    const filter = { email }

    if (purpose) {
        filter.purpose = purpose
    }
    else {
        filter.$or = [
            { purpose: { $exists: false } },
            { purpose: "register" }
        ]
    }

    return filter
}

async function getVerificationCode(email, purpose) {
    return EmailVerificationCode.findOne(emailFilter(email, purpose)).lean()
}

async function createVerificationCode(email, code) {
    const result = await EmailVerificationCode.create(
        {
            email: email,
            purpose: "register",
            code: code,
            attempts: 0,
            createdAt: new Date()
        }
    )

    return result.toObject()
}

async function upsertPasswordResetCode(email, code) {
    return EmailVerificationCode.findOneAndUpdate(
        { email, purpose: "password_reset" },
        {
            $set: {
                email,
                purpose: "password_reset",
                code,
                attempts: 0,
                createdAt: new Date()
            }
        },
        { upsert: true, new: true }
    ).lean()
}

async function incrementVerificationAttempts(email, purpose) {
    return EmailVerificationCode.findOneAndUpdate(
        emailFilter(email, purpose),
        { $inc: { attempts: 1 } },
        { new: true }
    ).lean()
}

async function deleteVerificationCode(email, purpose) {
    return EmailVerificationCode.findOneAndDelete(emailFilter(email, purpose)).lean();
}

module.exports = {
    createVerificationCode,
    upsertPasswordResetCode,
    incrementVerificationAttempts,
    deleteVerificationCode,
    getVerificationCode
}
