const { deleteFile } = require("./aws.services")

const { getUserByQuery, getUsersByQuery, getUsersByIds, getUserById } = require('../db/users.db')
const { getPostById, getPostByQuery, getPostsByQuery, createNewPost, updatePostById, deletePostById, doLikeToPost, doUnlikePost } = require('../db/posts')
const { getCategoryById, getCategoriesByIds } = require('../db/category.js')
const { addPostToSaved, removeNotification, addNotificationToUserById, removePostFromSaved } = require('../db/profile')
const { deleteCommentsByIds, getCommentsByPostId, getCommentsByPostIds } = require('../db/comments.js')

const { getCategories } = require('./categories.services.js')
const { commentPost, getComments, deleteComment, getCommentsForPosts } = require('./comments.services.js')
const { uploadImage } = require('./aws.services')

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')

const NotFoundError = require('../errors/NotFoundError')
const AppError = require('../errors/AppError');
const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const { LexRuntimeV2 } = require("aws-sdk")

function normalizePostIdsFilter(params = {}) {
    const hasIdsQuery = Object.prototype.hasOwnProperty.call(params, 'ids')
        || Object.prototype.hasOwnProperty.call(params, 'id')
        || Object.prototype.hasOwnProperty.call(params, '_id')

    const rawIds = []
    const candidates = [params.ids, params.id, params._id]

    for (const candidate of candidates) {
        if (candidate === undefined || candidate === null) continue

        if (Array.isArray(candidate)) {
            for (const value of candidate) {
                rawIds.push(...String(value).split(','))
            }
            continue
        }

        rawIds.push(...String(candidate).split(','))
    }

    const ids = rawIds
        .map((id) => id.trim())
        .filter(Boolean)

    if (!ids.length) {
        if (hasIdsQuery) {
            return { ...params, __emptyPostsResult: true }
        }

        return params
    }

    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id))

    if (invalidIds.length) {
        throw new BadRequestError({
            errors: {
                query: {
                    ids: {
                        message: 'Incorrect id format in ids query field!',
                        data: invalidIds
                    }
                }
            }
        })
    }

    const uniqueIds = [...new Set(ids)]

    delete params.ids
    delete params.id
    delete params._id
    params._id = { $in: uniqueIds }

    return params
}

async function createPost({
    title,
    content_text,
    category,
    featured_image,
    profile
}) {
    const category_data = await getCategoryById(category)

    if(!category_data) {
        throw new BadRequestError({
            errors: {
                body: {
                    category: {
                        message: 'Category not found!',
                        data: category
                    }
                }
            }
        })
    }

    var img_url = null

    if(featured_image) {
        if(featured_image.size !== 0){

            const image_upload_result = await uploadImage(featured_image, "featured_image", Date.now().toString())
            
            if(!image_upload_result) {
                throw new AppError({ message: "Error to upload image to storage!" })
            }
            else {
                img_url = image_upload_result
            }
        }
    }
        
    const post_creating_result = await createNewPost(title, content_text, category, profile._id, img_url)

    global.Logger.log({
        type: "create_post",
        message: `User ${profile.nick_name} created post`,
        data: {
            user: profile._id,
            post: post_creating_result.data._id
        }
    })

    return post_creating_result
}

async function editPost(id, data, profile) {
    const post = await getPostById(id)

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(data.category) {
        const category_data = await getCategoryById(data.category)
    
        if(!category_data) {
            throw new BadRequestError({
                errors: {
                    body: {
                        category: {
                            message: 'Category not found!',
                            data: invalidIds
                        }
                    }
                }
            })
        }
    }
    

    if(Object.keys(data).includes("featured_image")) {
        if(post.data.featured_image) {
            await deleteFile(post.data.featured_image)
        }

        if(data.featured_image !== undefined && data.featured_image !== null) { 
            const upload_image_result = await uploadImage(data.featured_image, "featured_image", Date.now().toString())
            if(!upload_image_result) {
                throw new AppError({ message: "Error to upload image to storage!" })
            }
            data.featured_image = upload_image_result
        }
        else {
            data.featured_image = null
        }
    }

    const result = await updatePostById(id, data)

    if(!result) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    global.Logger.log({
        type: "update_post",
        message: `User ${profile.nick_name} updated post ${post._id}`,
        data: {
            user: profile._id,
            post: result.data._id
        }
    })

    return result
}

async function getPosts(params, expand) {
    params = normalizePostIdsFilter(params);

    if (params.__emptyPostsResult) {
        delete params.__emptyPostsResult;

        return []
    }

    const posts = await getPostsByQuery(params);

    const postIds = posts.data.map(post => post._id)

    const commentsByPost = await getCommentsForPosts(postIds)

    for (const post of posts) {
        post.comments =
            commentsByPost.get(post._id.toString()) || []
    }

    const expand_options = expand
        ? expand.split(",").map((e) => e.trim())
        : [];

    if (expand_options.includes("author")) {
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

        const authorIds = [
            ...new Set(
                posts.map(post => post.author.toString())
            )
        ]


        for (const post of posts) {
            post.author = authorMap.get(
                post.author.toString()
            ) || null
        }
    }

    if (expand_options.includes("category")) {
        const categoryIds = [
            ...new Set(
                posts.data.map(post => post.category.toString())
            )
        ]

        const categories = await getCategoriesByIds(categoryIds)

        const categoryMap = new Map(
            categories.map(category => [
                category._id.toString(),
                category
            ])
        )

        for (const post of posts.data) {
            post.category = categoryMap.get(
                post.category.toString()
            ) || null
        }
    }

    return posts
}

async function getPost(id, expand) {
    const post = await getPostByQuery({ "_id": id })

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    const expand_options = expand ? expand.split(',').map((e) => e.trim()) : []

    if(expand_options.includes("author")) {
        const author = await getUserById(post.author)

        if(!author) {
            throw new AppError({ message: "Failed to get author for post!" })
        }

        post.author = {
            _id: author._id,
            nick_name: author.nick_name,
            avatar: author.avatar,
            is_verified: author.is_verified
        }
    }
    
    post.comments = await getComments(post._id, expand_options.includes("comments") ? "author" : null)

    if(expand_options.includes("category")) {
        const category_data = await getCategoryById(post.category)
        if(category_data) {
            post.category = category_data
        }
    }

    return post
}

async function deletePost(id, profile) {
    const post = await getPostById(id)

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    await removePostFromSavedForUsers(id)

    const comments = await getCommentsByPostId(id)
    
    if(comments.length > 0) {
        const commentIds = comments.map(comment => comment._id)
    
        const deletedComments = await deleteCommentsByIds(commentIds)
        
        if(!deletedComments) {
            throw new AppError({ message: "Failed to delete comments!" })
        }
    }

    const result = await deletePostById(id)
    
    if(!result) {
        throw new AppError({ message: "Failed to delete post!" })
    }

    await deleteFile(result.featured_image ?? "")

    const commentIds = comments.map(comment => comment._id)

    await removeNotification({
        type: {
            $in: ["reply_comment", "like_comment"]
        },
        comment: {
            $in: commentIds
        }
    })

    await removeNotification({
        type: {
            $in: ["like_post", "comment_post"]
        },
        post: id
    });

    global.Logger.log({
        type: "delete_post",
        message: `User ${profile.nick_name} deleted post ${id}`,
        data: {
            post: result._id,
            user: profile._id
        }
    })

    return result
}

async function savePost(profile, id) {
    if(!(await getPostByQuery({ "_id": id }))) {
        throw new NotFoundError({ message: "Post not found!" })
    }
    
    if(profile.saved_posts.some((p) => String(p) === id )) {
        throw new ConflictError({ message: "Post is already in saved posts!" })
    }

    const result =  await addPostToSaved(profile._id, id) 
    
    return {
        saved_posts: result.saved_posts
    }
}

async function unsavePost(profile, id) {
    if(!(await getPostByQuery({ "_id": id }))) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(!profile.saved_posts.some((p) => String(p) === id )) {
        throw new ConflictError({ message: "Post is not in saved posts!" })
    }

    const result = await removePostFromSaved(profile._id, id)


    return {
        saved_posts: result.saved_posts
    }
}

async function likePost(profile, post_id) {
    const post = await getPostById(post_id)

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(post.likes.some((like) => String(like) === String(profile._id))) {
        throw new ConflictError({ message: "Post is already liked!" })
    }

    const result = await doLikeToPost(profile._id, post_id)

    const author = await getUserById(post.author)
    
    if(!author._id.equals(profile._id)) {
        await addNotificationToUserById(author._id, { type: "like_post", user: profile._id, post: post_id })
    }
    
    return {
        likes: result.data.likes
    }
}

async function unlikePost(profile, post_id) {
    const post = await getPostByQuery({ "_id": post_id })

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    if(!post.likes.some((like) => String(like) === String(profile._id))) {
        throw new ConflictError({ message: "Post is not liked!" })
    }

    const result = await doUnlikePost(profile._id, post_id)

    return {
        likes: result.likes
    }
}

module.exports = {
    getPosts,
    getPost,
    createPost,
    editPost,
    deletePost,
    savePost,
    unsavePost,
    likePost,
    unlikePost,
}