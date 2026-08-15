const { getProfile } = require('../../services/profile.services')

const getProfileController = async (req, res, next) => {
    try {
        res.status(200).json({
            status: true,
            message: "Profile fetched successfully",
            data: req.profile
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = getProfileController