const { getRequest } = require('../../services/support.service')

const getSupportRequestController = async (req, res, next) => {
    try {
        const result = await getRequest(req.params.id, req.profile)

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

module.exports = getSupportRequestController
