const { listRequests } = require('../../services/support.service')

const listSupportRequestsController = async (req, res, next) => {
    try {
        const result = await listRequests(req.query, req.profile)

        return res.status(200).json({
            status: true,
            message: 'Support requests fetched successfully',
            data: result
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = listSupportRequestsController
