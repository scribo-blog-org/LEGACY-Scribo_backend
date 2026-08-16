const Mongoose = require('mongoose')

const { getUserByQuery, addFollowToUser, addFollowerToUser, removeFollowerFromUser, removeFollowFromUser, getUsersByQuery, getUserById, updateUserRole } = require('../db/users.db')
const { addNotificationToUserById } = require('../db/profile')

const { canManageRole } = require('../authorization/roleChecks')

const NotFoundError = require('../errors/NotFoundError')
const ConflictError = require('../errors/ConflictError')
const ForbiddenError = require('../errors/ForbiddenError')

async function getUserByNickName(nickName, options = {}) {
    const user = await getUserByQuery({ "nick_name": nickName }, options)
    
    if(!user) {
        throw new NotFoundError({ message: "User not found" })
    }
    
    if(user.is_saved_posts_public === false) delete user.saved_posts

    return user
}

async function getUsers(params){
    const allowed = ["nick_name", "email", "role", "is_verified", "_id"]

    const validParams = Object.fromEntries(
        Object.entries(params)
            .filter(([key]) => allowed.includes(key))
    )

    let users = await getUsersByQuery(validParams)

    users = users.map(user => {
        if(user.is_saved_posts_public === false) delete user.saved_posts

        return user
    })

    return users
}

async function follow(userId, profile) {
    let followed_user = await getUserById(userId)

    if(!followed_user) {
        throw new NotFoundError({ message: "User not found" })
    }
    
    if(profile.follows.some(item => item._id.equals(followed_user._id))) {
        throw new ConflictError({ message: "You are already following this user!" })
    }

    if(profile._id.equals(followed_user._id)) {
        throw new ConflictError({ message: "You cannot follow yourself!" })
    }

    await addNotificationToUserById(followed_user._id, { type: "follow", user: profile._id })
    
    
    const followed = await addFollowerToUser(profile._id, followed_user._id)
    const follower = await addFollowToUser(profile._id, followed_user._id)

    return {
        follower: follower,
        followed: followed
    }
}

async function unfollow(userId, profile) {
    let followed_user = await getUserById(userId)

    if(!followed_user) {
        throw new NotFoundError({ message: "User not found" })
    }

    if(profile._id.equals(followed_user._id)) {
        throw new ConflictError({ message: "You cannot unfollow yourself!" })
    }

    if(!profile.follows.some(item => item._id.equals(followed_user._id))) {
        throw new ConflictError({ message: "You are not following this user!" })
    }

    await addNotificationToUserById(followed_user._id, { type: "unfollow", user: profile._id })

    const followed = await removeFollowerFromUser(profile._id, followed_user._id)
    const follower = await removeFollowFromUser(profile._id, followed_user._id)

    return {
        follower: follower,
        followed: followed
    }
}

async function updateRole(userId, newRole, profile) {
    const user = await getUserById(userId)
    
    if(!user) {
        throw new NotFoundError({ message: "User not found" })
    }

    const canManage = canManageRole(profile.role, newRole, user.role)
    
    if(!canManage) {
        throw new ForbiddenError({ message: "You do not have permission to update this user's role" })
    }

    if(user.role === newRole) {
        throw new ConflictError({ message: "User already has this role" })
    }

    const result = await updateUserRole(user._id, newRole)

    if(!result) {
        throw new NotFoundError({ message: "User not found" })
    }

    global.Logger.log({
        type: "update_role",
        message: `User ${profile.nick_name} updated role for user ${userId}`,
        data: {
            user: profile._id,
            updated_user: new Mongoose.Types.ObjectId(userId),
            new_role: newRole
        }
    })

    return result
}

module.exports = {
    getUsers,
    getUserByNickName,
    follow,
    unfollow,
    updateRole
}