const { confirmPasswordResetCode } = require("../../services/auth/passwordReset.service")

const confirmPasswordResetController = async (req, res, next) => {
    try {
        await confirmPasswordResetCode(req.body.email, req.body.email_code)

        res.status(200).json({
            status: true,
            message: "Reset code confirmed",
            data: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = confirmPasswordResetController
