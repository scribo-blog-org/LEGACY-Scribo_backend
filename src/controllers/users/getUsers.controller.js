const { getUsers } = require("../../services/users.services")

const getUsersController = async (req, res, next) => {
    try {
        const users = await getUsers(req.query)
        
        res.status(200).json({
            status: true,
            message: "Users retrieved successfully",
            data: users
        })
    }
    catch(error) {
        next(error)
    } 
}

module.exports = getUsersController