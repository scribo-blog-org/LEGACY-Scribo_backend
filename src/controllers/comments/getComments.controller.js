const { getComments } = require('../../services/comments.services')

const getCommentsController = async (req, res, next) => {
    try {
        const result = await getComments(req.params.id, req.query.expand)

        res.status(200).json({
            status: true,
            message: "Comments fetched successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = getCommentsController  