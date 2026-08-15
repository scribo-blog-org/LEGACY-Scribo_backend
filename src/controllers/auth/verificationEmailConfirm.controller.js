const { confirmEmailCode } = require('../../services/auth/verification.service')

const verificationEmailConfirmController = async (req, res, next) => {
    try {
        await confirmEmailCode(req.body.email, req.body.email_code)

        res.status(200).json({
            status: true,
            message: "Email verification code confirmed successfully!",
            data: null
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = verificationEmailConfirmController