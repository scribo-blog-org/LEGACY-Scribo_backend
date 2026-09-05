const { trackVisit } = require("../../services/analytics.services")

const trackVisitController = async (req, res, next) => {
    try {
        await trackVisit(req.body, req.profile, req)

        res.status(200).json({
            status: true,
            message: "Visit recorded"
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = trackVisitController
