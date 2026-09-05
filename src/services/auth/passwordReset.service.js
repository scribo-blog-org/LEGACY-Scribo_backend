const crypto = require("crypto")

const BadRequestError = require("../../errors/BadRequestError")

const { getUserByQuery } = require("../../db/users.db")
const { editProfileById } = require("../../db/profile")
const { deleteSessionsByUserId } = require("../../db/sessions.db")
const {
    upsertPasswordResetCode,
    getVerificationCode,
    deleteVerificationCode,
    incrementVerificationAttempts
} = require("../../db/email")
const { sendEmail } = require("./utils/email")
const { setPasswordHash } = require("./utils/password")
const passwordResetCodeTemplate = require("./templates/password_reset_code")
const { notifyPasswordChanged } = require("../profile.services")

const RESET_PURPOSE = "password_reset"
const MAX_CODE_ATTEMPTS = 5

function invalidCodeError() {
    return new BadRequestError({
        message: "Invalid verification code!",
        errors: {
            body: {
                email_code: {
                    message: "Неверный код",
                    data: ""
                }
            }
        }
    })
}

function fieldError(field, message) {
    return new BadRequestError({
        errors: {
            body: {
                [field]: {
                    message,
                    data: ""
                }
            }
        }
    })
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase()
}

function codesMatch(left, right) {
    const a = Buffer.from(String(left || ""))
    const b = Buffer.from(String(right || ""))

    if (a.length !== b.length) {
        return false
    }

    return crypto.timingSafeEqual(a, b)
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function findUserByEmail(email) {
    const normalized = normalizeEmail(email)

    return getUserByQuery(
        { email: { $regex: `^${escapeRegex(normalized)}$`, $options: "i" } },
        { with_password: true, with_saved_posts: false }
    )
}

async function requestPasswordReset(email) {
    const normalized = normalizeEmail(email)
    const user = await findUserByEmail(normalized)

    if (!user?.email) {
        return
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    await upsertPasswordResetCode(normalized, code)

    try {
        await sendEmail({
            to: user.email,
            subject: "Код для сброса пароля Scribo",
            html: passwordResetCodeTemplate({
                code,
                nickName: user.nick_name
            })
        })
    }
    catch (error) {
        console.error("Failed to send password reset email", error)
    }
}

async function assertResetCode(email, email_code) {
    const normalized = normalizeEmail(email)
    const record = await getVerificationCode(normalized, RESET_PURPOSE)

    if (!record || record.attempts >= MAX_CODE_ATTEMPTS || !codesMatch(record.code, email_code)) {
        if (record) {
            const updated = await incrementVerificationAttempts(normalized, RESET_PURPOSE)
            if ((updated?.attempts || 0) >= MAX_CODE_ATTEMPTS) {
                await deleteVerificationCode(normalized, RESET_PURPOSE)
            }
        }

        throw invalidCodeError()
    }

    return normalized
}

async function confirmPasswordResetCode(email, email_code) {
    await assertResetCode(email, email_code)
}

async function resetPassword({ email, email_code, new_password, new_password_confirm }) {
    if (new_password !== new_password_confirm) {
        throw fieldError("new_password_confirm", "Пароли не совпадают")
    }

    const normalized = await assertResetCode(email, email_code)
    const user = await findUserByEmail(normalized)

    if (!user) {
        throw invalidCodeError()
    }

    await editProfileById(user._id, { password: setPasswordHash(new_password) })
    await deleteSessionsByUserId(user._id)
    await deleteVerificationCode(normalized, RESET_PURPOSE)
    notifyPasswordChanged(user)
}

module.exports = {
    requestPasswordReset,
    confirmPasswordResetCode,
    resetPassword
}
