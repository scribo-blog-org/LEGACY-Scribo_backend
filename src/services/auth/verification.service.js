const AppError = require("../../errors/AppError")
const BadRequestError = require("../../errors/BadRequestError")
const ConflictError = require("../../errors/ConflictError")
const { getEmailByGoogleToken } = require("../auth/utils/google")
const { getUserByQuery } = require("../../db/users.db")
const { sendEmail } = require("../auth/utils/email")
const { createVerificationCode, getVerificationCode } = require("../../db/email")

async function verifyGoogleToken(google_token) {
    const email = await getEmailByGoogleToken(google_token)

    if(!email) {
        throw new BadRequestError({
            errors: {
                body: {
                    google_token: {
                        message: "Google token is invalid",
                        data: google_token
                    }
                }
            }
        })
    }

    const user = await getUserByQuery({ email: email.email })

    return {
        email: email.email,
        is_registered: !!user
    }
}

async function requestVerificationCode(email) {
    if(!email) {
        throw new AppError({ message: "Email is required to send verification code!" })
    }
    
    const user = await getUserByQuery({ email: email })

    if(user.status) {
        throw new ConflictError({ message: "User with this email is already exists!" })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await sendEmail({
        to: email,
        subject: "Your verification code",
        code: code
    });

    const result = await createVerificationCode(email, code);

    if(!result) {
        throw new AppError({ message: "Failed to create verification code!" })
    }

    return result
}

async function confirmEmailCode(email, email_code) {
    const code = await getVerificationCode(email)
    
    if(!code) {
        throw new BadRequestError({
            message: "Verification code is not initiated!",
            errors: {
                body: {
                    email: {
                        message: "No pending confirmation found for this email address. Please request a new code!",
                        data: email
                    }
                }
            }
        })
    }

    if(code.code !== email_code) {
        throw new BadRequestError({
            message: "Invalid verification code!",
            errors: {
                body: {
                    email_code: {
                        message: "Invalid verification code!",
                        data: email_code
                    }
                }
            }
        })
    }

    return true
}

module.exports = {
    verifyGoogleToken,
    requestVerificationCode,
    confirmEmailCode
}