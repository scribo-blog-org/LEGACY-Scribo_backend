const Post = require('../models/Post')

async function getPostById(id) {
    return Post.findById(id).lean()
}

async function getPostsByQuery(query = {}) {
    return Post.find(query).lean()
}

async function getPostByQuery(query = {}) {
    return Post.findOne(query).lean()
}

async function createNewPost(title, content_text, category, author, featured_image=null) {
    const new_post = await Post.create({
        author: author,
        title: title,
        featured_image: featured_image,
        content_text: content_text,
        category: category
    })

    return new_post.toObject()
}

async function updatePostById(id, data) {
    return Post.findByIdAndUpdate(id, data, { new: true }).lean()
}

async function deletePostById(id) {
    return Post.findByIdAndDelete(id).lean();
}

async function doLikeToPost(user_id, post_id) {
    return Post.findByIdAndUpdate(
        post_id,
        { $addToSet: { likes: user_id } },
        { new: true }
    ).lean()
}

async function doUnlikePost(user_id, post_id) {
    return Post.findByIdAndUpdate(
        post_id,
        { $pull: { likes: user_id } },
        { new: true }
    ).lean()
}

module.exports = {
    getPostById,
    getPostsByQuery,
    getPostByQuery,
    createNewPost,
    updatePostById,
    deletePostById,
    doLikeToPost,
    doUnlikePost
}