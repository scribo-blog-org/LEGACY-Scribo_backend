const { revokeSession } = require('../../services/auth/session.service')
const { clearRefreshCookie } = require('../../services/auth/utils/cookies')

const deleteSessionController = async (req, res, next) => {
    try {
        const result = await revokeSession(req.profile, req.params.id, req)

        if (result.wasCurrent) {
            clearRefreshCookie(res)
        }

        res.status(200).json({
            status: true,
            message: "Session deleted",
            data: result
        })
    }
    catch (err) {
        next(err)
    }
}

module.exports = deleteSessionController
