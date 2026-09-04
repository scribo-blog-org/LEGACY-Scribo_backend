const { loginByUserName } = require('../../services/auth/login.service')
const { issueSession } = require('../../services/auth/session.service')
const { setRefreshCookie } = require('../../services/auth/utils/cookies')

const loginByUsernameController = async (req, res, next) => {
    try {
        const user = await loginByUserName({ userName: req.body.user_name, password: req.body.password })
        const { accessToken, refreshToken } = await issueSession(user, req)

        setRefreshCookie(res, refreshToken)

        res.status(200).json({
            status: true,
            message: "Login by username successful",
            data: { accessToken }
        })
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByUsernameController
