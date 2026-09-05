const { replyToPublicRequest } = require('../../services/support.service')

const replyPublicSupportRequestController = async (req, res, next) => {
    try {
        const result = await replyToPublicRequest(req.params.key, req.body.text, req.profile)

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

module.exports = replyPublicSupportRequestController
