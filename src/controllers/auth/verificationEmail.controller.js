const { requestVerificationCode } = require("../../services/auth/verification.service")

const verificationEmailController = async (req, res, next) => {
    try {
        const result = await requestVerificationCode(req.body.email)
        
        res.status(200).json({
            status: true,
            message: "Verification code sent to email",
            data: null
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = verificationEmailController