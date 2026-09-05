const { createRequest } = require('../../services/support.service')

const createSupportRequestController = async (req, res, next) => {
    try {
        const result = await createRequest(req.body, req.profile)

        return res.status(200).json({
            status: true,
            message: 'Support request created successfully',
            data: result
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = createSupportRequestController
