const { listMyRequests } = require('../../services/support.service')

const listMySupportRequestsController = async (req, res, next) => {
    try {
        const result = await listMyRequests(req.query, req.profile)

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

module.exports = listMySupportRequestsController
