const { unlikePost } = require("../../services/posts.services")

const unlikePostController = async (req, res, next) => {
    try {
        const result = await unlikePost(req.profile, req.params.id);
        
        res.status(200).json({
            status: true,
            message: "Post unliked successfully!",
            data: result
        });
    }
    catch(error) {
        next(error)
    }
}

module.exports = unlikePostController