const { listUserSessions } = require('../../services/auth/session.service')

const getSessionsController = async (req, res, next) => {
    try {
        const sessions = await listUserSessions(req.profile, req)

        res.status(200).json({
            status: true,
            message: "Sessions",
            data: sessions
        })
    }
    catch (err) {
        next(err)
    }
}

module.exports = getSessionsController
