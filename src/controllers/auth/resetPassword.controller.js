const { resetPassword } = require("../../services/auth/passwordReset.service")

const resetPasswordController = async (req, res, next) => {
    try {
        await resetPassword(req.body)

        res.status(200).json({
            status: true,
            message: "Password updated successfully",
            data: null
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = resetPasswordController
