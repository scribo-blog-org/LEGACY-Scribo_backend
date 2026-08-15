const { ObjectId } = require('mongoose').Types
const User = require('../models/User')

async function getUsersByQuery(query = {}, options = { }) {
    options = {
        with_password: false,
        with_saved_posts: true,
        with_notifications: false,
        ...options,
    };

    let users = await User.find(query).lean()

    users = users.map(user => {

        if (!options.with_password) {
            delete user.password;
        }

        if (!options.with_saved_posts) {
            delete user.saved_posts;
        }

        if (!options.with_notifications) {
            delete user.notifications;
        }

        return user;
    })

    return users
}

async function getUsersByIds(userIds = [], options = { }) {
    options = {
        with_password: false,
        with_saved_posts: true,
        with_notifications: false,
        ...options,
    };

    const users = await User.find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).lean()

    return users.map(user => {
        if (!options.with_password) {
            delete user.password;
        }
        if (!options.with_saved_posts) {
            delete user.saved_posts;
        }
        if (!options.with_notifications) {
            delete user.notifications;
        }
        return user;
    })
}

async function getUserById(id, options = { }) {
    options = {
        with_password: false,
        with_saved_posts: true,
        with_notifications: false,
        ...options,
    };

    let user = await User.findById(id).lean()

    if(user) {
        if(options.with_password === false) delete user.password
        if(options.with_saved_posts === false) delete user.saved_posts
        if(options.with_notifications === false) delete user.notifications
    }

    return user
}

async function getUserByQuery(query = {}, options = { }) {
    options = {
        with_password: false,
        with_saved_posts: true,
        with_notifications: false,
        ...options,
    };

    let user = await User.findOne(query).lean()

    if(user) {
        if(options.with_password === false) delete user.password
        if(options.with_saved_posts === false) delete user.saved_posts
        if(options.with_notifications === false) delete user.notifications
    }

    return user
}

async function addFollowerToUser(follower_id, followed_id) {
    return User.findByIdAndUpdate(
        followed_id,
        {
            $addToSet: {
                followers: follower_id
            }
        },
        { new: true }
    ).lean()
}

async function addFollowToUser(follower_id, followed_id) {
    return User.findByIdAndUpdate(
        follower_id,
        {
            $addToSet: {
                follows: followed_id
            }
        },
        { new: true }
    ).lean()
}

async function removeFollowerFromUser(follower_id, followed_id) {
    const followed = await User.findOneAndUpdate(
        { _id: followed_id },
        {
            $pull: {
                followers: follower_id
            }
        },
        { new: true }
    ).lean();

    return followed
}

async function removeFollowFromUser(follower_id, followed_id) {
    const follower = await User.findOneAndUpdate(
        { _id: follower_id },
        {
            $pull: {
                follows: followed_id
            }
        },
        { new: true }
    ).lean();

    return follower
}

async function removePostFromSaved(userId, postId) {
    return User.findByIdAndUpdate(
        userId,
        { $pull: { saved_posts: new ObjectId(postId) } },
        { new: true }
    ).lean()
}

async function createNewUser(user) {
    const newUser = new User(user)
    const savedUser = await newUser.save();

    return savedUser.toObject()
}

async function updateUserRole(userId, newRole) {
    return User.findByIdAndUpdate(
        userId,
        { role: newRole },
        { new: true }
    ).lean()
}

module.exports = {
    getUsersByQuery,
    getUserById,
    getUsersByIds,
    getUserByQuery,
    addFollowerToUser,
    addFollowToUser,
    removeFollowerFromUser,
    removeFollowFromUser,
    removePostFromSaved,
    createNewUser,
    updateUserRole
}