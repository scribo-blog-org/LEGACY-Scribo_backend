const EmailVerificationCode = require("../models/email")

async function getVerificationCode(email) {
    return EmailVerificationCode.findOne({ email: email }).lean()
}

async function createVerificationCode(email, code) {
    const result = await EmailVerificationCode.create(
        {
            email: email,
            code: code,
            createdAt: new Date()
        }
    )

    return result.toObject()
}

async function deleteVerificationCode(email) {
    return EmailVerificationCode.findOneAndDelete({ email: email }).lean();
}

module.exports = {
    createVerificationCode,
    deleteVerificationCode,
    getVerificationCode
}