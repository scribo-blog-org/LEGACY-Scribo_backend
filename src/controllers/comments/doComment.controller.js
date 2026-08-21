const { commentPost } = require('../../services/comments.services')

const doCommentController = async (req, res, next) => {
    try {
        const result = await commentPost(
            req.params.id,
            req.body.comment_text,
            req.body.parent_comment_id,
            req.profile
        )
    
        res.status(200).json({
            status: true,
            message: "Comment added successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = doCommentController