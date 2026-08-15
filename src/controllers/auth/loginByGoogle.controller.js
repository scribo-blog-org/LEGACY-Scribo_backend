const { loginByGoogle } = require('../../services/auth/login.service')

const loginByGoogleController = async (req, res, next) => {
    try {
        const result = await loginByGoogle(req.body.google_token)

        res.status(200).json({
            status: true,
            message: "Login by Google successful",
            data: result
        })
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByGoogleController