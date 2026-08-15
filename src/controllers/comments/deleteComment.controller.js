const { deleteComment } = require('../../services/comments.services')

const deleteCommentController = async (req, res, next) => {
    try {
        const result = await deleteComment(req.params.id)

        res.status(200).json({
            status: true,
            message: "Comment deleted successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = deleteCommentController