const { deleteFile } = require("./aws.services")

const { getUsersByIds, getUserById } = require('../db/users.db')
const { getPostById, getPostByQuery, getPostsByQuery, countPostsByQuery, createNewPost, updatePostById, deletePostById, doLikeToPost, doUnlikePost } = require('../db/posts')
const { getCategoryById, getCategoriesByIds } = require('../db/category.js')
const { addPostToSaved, removeNotification, addNotificationToUserById, removePostFromSaved, removePostFromSavedForUsers } = require('../db/profile')
const { deleteCommentsByIds, getCommentsByPostId } = require('../db/comments.js')

const { getComments, getCommentsForPosts } = require('./comments.services.js')
const { uploadImage } = require('./aws.services')

const mongoose = require('mongoose')

const NotFoundError = require('../errors/NotFoundError')
const AppError = require('../errors/AppError');
const ConflictError = require('../errors/ConflictError');
const BadRequestError = require('../errors/BadRequestError');
const {
    parsePagination,
    omitPaginationFields,
    paginationMeta,
    asObjectIdFilter
} = require('../utils/pagination')
const PERMISSIONS = require('../authorization/permissions')
const { actorFromProfile, assertPermission, assertOwnerOrPermission } = require('../authorization/roleChecks')

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
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.CREATE_POST,
        "You don't have permission to create a post"
    )

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
            post: post_creating_result._id
        }
    })

    return post_creating_result
}

async function editPost(id, data, profile) {
    const post = await getPostById(id)

    if(!post) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    assertOwnerOrPermission(
        post.author,
        actorFromProfile(profile),
        PERMISSIONS.EDIT_ANY_POST,
        "You don't have permission to update a post"
    )

    if(data.category) {
        const category_data = await getCategoryById(data.category)
    
        if(!category_data) {
            throw new BadRequestError({
                errors: {
                    body: {
                        category: {
                            message: 'Category not found!',
                            data: data.category
                        }
                    }
                }
            })
        }
    }
    

    if(Object.keys(data).includes("featured_image")) {
        if(post.featured_image) {
            await deleteFile(post.featured_image)
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
            post: result._id
        }
    })

    return result
}

async function getPosts(params, expand) {
    const { page, limit, skip } = parsePagination(params, { defaultLimit: 5, maxLimit: 50 })
    params = omitPaginationFields(params)
    params = normalizePostIdsFilter(params);

    if (params.__emptyPostsResult) {
        delete params.__emptyPostsResult;

        return {
            items: [],
            pagination: paginationMeta({ page, limit, total: 0 })
        }
    }

    if (params.author) {
        params.author = asObjectIdFilter(params.author)
    }

    if (params.category) {
        params.category = asObjectIdFilter(params.category)
    }

    const total = await countPostsByQuery(params)
    const posts = await getPostsByQuery(params, {
        skip,
        limit,
        sort: { created_date: -1 }
    });

    const postIds = posts.map(post => post._id)

    const commentsByPost = await getCommentsForPosts(postIds)

    for (const post of posts) {
        post.comments =
            commentsByPost.get(post._id.toString()) || []
    }

    const expand_options = expand
        ? expand.split(",").map((e) => e.trim())
        : [];

    if (expand_options.includes("author")) {
        const authorIds = [
            ...new Set(
                posts.map(post => post.author.toString())
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

        for (const post of posts) {
            post.author = authorMap.get(
                post.author.toString()
            ) || null
        }
    }

    if (expand_options.includes("category")) {
        const categoryIds = [
            ...new Set(
                posts.map(post => post.category.toString())
            )
        ]

        const categories = await getCategoriesByIds(categoryIds)

        const categoryMap = new Map(
            categories.map(category => [
                category._id.toString(),
                category
            ])
        )

        for (const post of posts) {
            post.category = categoryMap.get(
                post.category.toString()
            ) || null
        }
    }

    return {
        items: posts,
        pagination: paginationMeta({ page, limit, total })
    }
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

    assertOwnerOrPermission(
        post.author,
        actorFromProfile(profile),
        PERMISSIONS.DELETE_ANY_POST,
        "You don't have permission to delete a post"
    )

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

    const actor = await getUserById(profile._id)

    if (!actor) {
        throw new NotFoundError({ message: "User not found!" })
    }
    
    if((actor.saved_posts || []).some((p) => String(p) === id )) {
        throw new ConflictError({ message: "Post is already in saved posts!" })
    }

    const result =  await addPostToSaved(actor._id, id) 
    
    return {
        saved_posts: result.saved_posts
    }
}

async function unsavePost(profile, id) {
    if(!(await getPostByQuery({ "_id": id }))) {
        throw new NotFoundError({ message: "Post not found!" })
    }

    const actor = await getUserById(profile._id)

    if (!actor) {
        throw new NotFoundError({ message: "User not found!" })
    }

    if(!(actor.saved_posts || []).some((p) => String(p) === id )) {
        throw new ConflictError({ message: "Post is not in saved posts!" })
    }

    const result = await removePostFromSaved(actor._id, id)


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
    
    if(String(author._id) !== String(profile._id)) {
        await addNotificationToUserById(author._id, { type: "like_post", user: profile._id, post: post_id })
    }
    
    return {
        likes: result.likes
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