const { loginByUserName } = require('../../services/auth/login.service')

const loginByUsernameController = async (req, res, next) => {
    try {
        const result = await loginByUserName({ userName: req.body.user_name, password: req.body.password })
        res.status(200).json({
            status: true,
            message: "Login by username successful",
            data: result
        })
    }
    catch(err) {
        next(err)
    }
}

module.exports = loginByUsernameController