const postComment = require('../models/PostComment')

async function addCommentToPost(post_id, comment_text, author_id) {
    const newComment = await postComment.create({
        post_id,
        comment_text,
        author: author_id
    })

    return newComment.toObject()
}

async function addReplyToComment(post_id, parent_comment_id, comment_text, author_id) {
    const newComment = await postComment.create({
        post_id,
        comment_text: comment_text,
        author: author_id,
        parent_comment_id: parent_comment_id
    })

    return newComment.toObject()
}

async function getCommentsByPostId(post_id) {
    return postComment.find({ post_id: post_id }).lean()
}

async function getCommentsByPostIds(post_ids) {
    return postComment.find({
        post_id: { $in: post_ids }
    }).lean()
} 

async function getCommentById(comment_id) {
    return postComment.findById(comment_id).lean()
}

async function getCommentsByQuery(query = {}) {
    return postComment.find(query).lean()
}

async function deleteCommentById(comment_id) {
    return postComment.findByIdAndDelete(comment_id).lean()
}

async function deleteCommentsByIds(comment_ids) {
    return postComment.deleteMany({ _id: { $in: comment_ids } })
}

async function updateCommentById(comment_id, comment_text) {
    return postComment.findByIdAndUpdate(
        comment_id,
        { comment_text },
        {
            new: true,
            runValidators: true
        }
    ).lean();
}

async function addLikeToComment(comment_id, profile_id) {
    return postComment.findByIdAndUpdate(
        comment_id,
        { $addToSet: { likes: profile_id } },
        {
            new: true,
            runValidators: true
        }
    ).lean();
}

async function removeLikeFromComment(comment_id, profile_id) {
    return postComment.findByIdAndUpdate(
        comment_id,
        { $pull: { likes: profile_id } },
        {
            new: true,
            runValidators: true
        }
    ).lean();
}

module.exports = {
    addCommentToPost,
    addReplyToComment,
    getCommentsByPostId,
    getCommentsByPostIds,
    getCommentsByQuery,
    deleteCommentById,
    getCommentById,
    deleteCommentsByIds,
    updateCommentById,
    addLikeToComment,
    removeLikeFromComment
}