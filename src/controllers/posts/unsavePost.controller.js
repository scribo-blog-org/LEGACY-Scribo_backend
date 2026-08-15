const { unsavePost } = require('../../services/posts.services')

const unsavePostController = async (req, res, next) => {
    try {
        const result = await unsavePost(req.profile, req.params.id)
    
        res.status(200).json({
            status: true,
            message: "Post unsaved successfully!",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = unsavePostController