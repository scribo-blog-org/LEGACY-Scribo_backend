const { deletePost } = require('../../services/posts.services')

const deletePostController = async (req, res, next) => {
    try {
        const result = await deletePost(req.params.id, req.profile)

        res.status(200).json({
            status: true,
            message: "Post deleted successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = deletePostController