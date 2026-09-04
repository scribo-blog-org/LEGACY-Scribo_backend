const { refreshSession } = require('../../services/auth/session.service')
const { setRefreshCookie } = require('../../services/auth/utils/cookies')

const refreshController = async (req, res, next) => {
    try {
        const result = await refreshSession(req)

        setRefreshCookie(res, result.refreshToken)

        res.status(200).json({
            status: true,
            message: "Token refreshed",
            data: { accessToken: result.accessToken }
        })
    }
    catch (err) {
        next(err)
    }
}

module.exports = refreshController
