const { getPublicRequest } = require('../../services/support.service')

const getPublicSupportRequestController = async (req, res, next) => {
    try {
        const result = await getPublicRequest(req.params.key, req.profile)

        return res.status(200).json({
            status: true,
            message: 'Support request fetched successfully',
            data: result
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = getPublicSupportRequestController
