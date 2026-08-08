const { updateRole } = require('../../services/users.services')

const updateRoleController = async (req, res, next) => {
    try {
        const result = await updateRole(req.params["id"], req.body.role, req.profile)

        res.status(200).json(result)
    }
    catch(error) {
        next(error)
    }
}

module.exports = updateRoleController