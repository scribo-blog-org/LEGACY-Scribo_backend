const { editComment } = require('../../services/comments.services')

const editCommentController = async (req, res, next) => {
    try {
        const result = await editComment(req.params.id, req.body.comment_text)
        
        res.status(200).json({
            status: true,
            message: "Comment edited successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = editCommentController