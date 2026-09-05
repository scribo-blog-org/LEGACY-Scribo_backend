const { getDashboard } = require("../../services/analytics.services")

const getDashboardController = async (req, res, next) => {
    try {
        const result = await getDashboard(req.query, req.profile)

        res.status(200).json({
            status: true,
            message: "Analytics fetched successfully",
            data: result
        })
    }
    catch (error) {
        next(error)
    }
}

module.exports = getDashboardController
