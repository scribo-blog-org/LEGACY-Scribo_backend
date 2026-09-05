const { requestPasswordReset } = require("../../services/auth/passwordReset.service")

const requestPasswordResetController = async (req, res, next) => {
    try {
        await requestPasswordReset(req.body.email)

        res.status(200).json({
            status: true,
            message: "If an account exists, a reset code was sent",
            data: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = requestPasswordResetController
