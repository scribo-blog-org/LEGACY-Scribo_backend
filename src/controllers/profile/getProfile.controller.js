const { getProfile, withAccessRole } = require('../../services/profile.services')

const getProfileController = async (req, res, next) => {
    try {
        const profile = await getProfile(req.auth.id)

        res.status(200).json({
            status: true,
            message: "Profile fetched successfully",
            data: withAccessRole(profile, req.auth)
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = getProfileController
