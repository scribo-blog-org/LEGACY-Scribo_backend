const { getPostById } = require('../../services/posts.services')

const getPostByIdController = async (req, res, next) => {
    try {
        const result = await getPostById(req.params.id, req.query.expand)

        res.status(200).json({
            status: true,
            message: "Post fetched successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = getPostByIdController