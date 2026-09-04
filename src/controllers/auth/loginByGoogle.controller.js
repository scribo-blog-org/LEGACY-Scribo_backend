const { loginByGoogle } = require('../../services/auth/login.service')
const { issueSession } = require('../../services/auth/session.service')
const { setRefreshCookie } = require('../../services/auth/utils/cookies')

const loginByGoogleController = async (req, res, next) => {
    try {
        const user = await loginByGoogle(req.body.google_token)
        const { accessToken, refreshToken } = await issueSession(user, req)

        setRefreshCookie(res, refreshToken)

        res.status(200).json({
            status: true,
            message: "Login by Google successful",
            data: { accessToken }
        })
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByGoogleController
