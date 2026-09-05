const { replyToRequest } = require('../../services/support.service')

const replySupportRequestController = async (req, res, next) => {
    try {
        const result = await replyToRequest(req.params.id, req.body.text, req.profile)

        return res.status(200).json({
            status: true,
            message: 'Support reply sent successfully',
            data: result
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = replySupportRequestController
