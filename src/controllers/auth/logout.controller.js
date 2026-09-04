const { logoutSession } = require('../../services/auth/session.service')
const { clearRefreshCookie } = require('../../services/auth/utils/cookies')

const logoutController = async (req, res, next) => {
    try {
        await logoutSession(req)
        clearRefreshCookie(res)

        res.status(200).json({
            status: true,
            message: "Logout successful",
            data: null
        })
    }
    catch (err) {
        next(err)
    }
}

module.exports = logoutController
