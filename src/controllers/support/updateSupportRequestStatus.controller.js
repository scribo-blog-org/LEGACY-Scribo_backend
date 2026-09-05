const { updateRequestStatus } = require('../../services/support.service')

const updateSupportRequestStatusController = async (req, res, next) => {
    try {
        const result = await updateRequestStatus(req.params.id, req.body.status, req.profile)

        return res.status(200).json({
            status: true,
            message: 'Support request status updated successfully',
            data: result
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = updateSupportRequestStatusController
