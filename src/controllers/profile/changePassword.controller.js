const { changePassword } = require("../../services/profile.services")

const changePasswordController = async (req, res, next) => {
    try {
        await changePassword(req.profile, req.body)

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

module.exports = changePasswordController