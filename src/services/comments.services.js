const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const AppError = require('../errors/AppError');

const { addCommentToPost,
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
    } = require('../db/comments')
const { getPostByQuery } = require('../db/posts')
const { getUserByQuery, getUsersByIds } = require('../db/users.db')
const { addNotificationToUserById, removeNotification } = require('../db/profile')

async function commentPost(post_id, comment_text, parent_comment_id, profile) {
    const post = await getPostByQuery({ _id: post_id })

    if (!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    let result

    if (parent_comment_id) {
        const parentComment = await getCommentById(parent_comment_id)

        if (!parentComment) {
            throw new NotFoundError({ message: "Parent comment not found!" })
        }

        if (parentComment.post_id.toString() !== post_id.toString()) {
            throw new ConflictError({
                message: "Parent comment does not belong to this post!"
            })
        }

        result = await addReplyToComment(
            post_id,
            parent_comment_id,
            comment_text,
            profile._id
        )

        const comment_author = parentComment.author

        if (comment_author.toString() !== profile._id.toString()) {
            await addNotificationToUserById(
                comment_author,
                {
                    type: "reply_comment",
                    user: profile._id,
                    comment: result._id,
                    post: post_id
                }
            )
        }
    }
    else {
        result = await addCommentToPost(
            post_id,
            comment_text,
            profile._id
        )

        const post_author = post.author

        if (post_author.toString() !== profile._id.toString()) {
            await addNotificationToUserById(
                post_author,
                {
                    type: "comment_post",
                    user: profile._id,
                    post: post_id,
                    comment: result._id
                }
            )
        }
    }

    return result
}

async function getComments(post_id, expand) {
    const post = await getPostByQuery({ _id: post_id })

    if (!post) {
        throw new NotFoundError({
            message: "Post not found!"
        })
    }

    const comments = await getCommentsByPostId(post_id)

    if (expand === "author") {
        const authorIds = [
            ...new Set(
                comments.map(comment => comment.author.toString())
            )
        ]

        const authors = await getUsersByIds(authorIds)

        const authorMap = new Map(
            authors.map(author => [
                author._id.toString(),
                {
                    _id: author._id,
                    nick_name: author.nick_name,
                    avatar: author.avatar,
                    is_verified: author.is_verified
                }
            ])
        )

        for (const comment of comments) {
            comment.author = authorMap.get(
                comment.author.toString()
            ) || null
        }
    }

    return buildCommentsTree(comments)
}

function buildCommentsTree(comments) {
    const commentMap = new Map()
    const roots = []

    for (const comment of comments) {
        comment.replies = []
        commentMap.set(comment._id.toString(), comment)
    }

    for (const comment of comments) {
        if (!comment.parent_comment_id) {
            roots.push(comment)
            continue
        }

        const parent = commentMap.get(
            comment.parent_comment_id.toString()
        )

        if (parent) {
            parent.replies.push(comment)
        }
    }

    return roots
}

async function deleteComment(comment_id) {
    const rootComment = await getCommentById(comment_id)

    if (!rootComment) {
        throw new NotFoundError({
            message: "Comment not found!"
        })
    }

    const comments = await getCommentsByPostId(rootComment.post_id)

    const commentIds = getCommentIdsToDelete(
        comments,
        rootComment._id
    )

    const result = await deleteCommentsByIds(commentIds)

    await removeNotification({
        comment: {
            $in: commentIds
        }
    })

    return result
}

function getCommentIdsToDelete(comments, rootCommentId) {
    const childrenMap = new Map()

    for (const comment of comments) {
        if (!comment.parent_comment_id) {
            continue
        }

        const parentId = comment.parent_comment_id.toString()

        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, [])
        }

        childrenMap.get(parentId).push(comment._id)
    }

    const result = [rootCommentId]
    const queue = [rootCommentId.toString()]

    while (queue.length > 0) {
        const parentId = queue.shift()

        const children = childrenMap.get(parentId) || []

        for (const childId of children) {
            result.push(childId)
            queue.push(childId.toString())
        }
    }

    return result
}

async function editComment(comment_id, comment_text) {
    const comment = await getCommentById(comment_id)

    if(!comment) {
        throw new NotFoundError({ message: comment.message })
    }

    const result = await updateCommentById(comment_id, comment_text)

    return result
}

async function getCommentsForPosts(post_ids) {
    const comments = await getCommentsByPostIds(post_ids)

    return buildCommentsTreesByPost(comments)
}

async function likeComment(comment_id, profile) {
    const comment = await getCommentById(comment_id)

    if(!comment) {
        throw new NotFoundError({ message: comment.message })
    }

    if(comment.likes.some(id => id.equals(profile._id))) {
        throw new ConflictError({ message: "You have already liked this comment!" })
    }

    const result = await addLikeToComment(comment_id, profile._id)

    return result
}

async function unlikeComment(comment_id, profile) {
    const comment = await getCommentById(comment_id)

    if(!comment) {
        throw new NotFoundError({ message: comment.message })
    }

    if(!comment.likes.some(id => id.equals(profile._id))) {
        throw new ConflictError({ message: "You have not liked this comment!" })
    }

    const result = await removeLikeFromComment(comment_id, profile._id)

    return result
}

module.exports = {
    commentPost,
    getComments,
    getCommentsForPosts,
    deleteComment,
    editComment,
    likeComment,
    unlikeComment
}