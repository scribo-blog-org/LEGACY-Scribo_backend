const { Types } = require("mongoose")

const User = require('../models/User')

const { getUserById } = require('./users.db')

async function addPostToSaved(user_id, post_id) {
    return User.findByIdAndUpdate(
        user_id,
        { $addToSet: { saved_posts: post_id } },
        { new: true }
    ).lean()
}

async function removePostFromSaved(user_id, post_id) {
    return User.findByIdAndUpdate(
        user_id,
        { $pull: { saved_posts: post_id } },
        { new: true }
    ).lean();
}

async function removePostFromSavedForUsers(postId) {
    return User.updateMany(
        {
            saved_posts: postId
        },
        {
            $pull: {
                saved_posts: postId
            }
        }
    )
}

async function readNotificationsByUserId(user_id) {
    return User.findByIdAndUpdate(
        user_id,
        {
            $set: {
                'notifications.$[].is_read': true
            }
        },
        { new: true }
    ).lean()
}

async function addNotificationToUserById(user_id, notification) {
    const notification_types = ["follow", "unfollow", "comment_post", "reply_comment", "like_post"]

    if(!notification || !notification.type || !notification_types.includes(notification.type)) {
        throw new Error(`Incorrect type of notification!\nnotification: ${JSON.stringify(notification, null, 2)}`)
    }
    let user = await getUserById(user_id)
    
    if(!user) {
        throw new Error(`Failed to find user!\nuser_id: ${user_id}` )
    }

    const object = {};

    if (notification?.user) {
        object.user = new Types.ObjectId(notification.user);
    }

    if (notification?.post) {
        object.post = new Types.ObjectId(notification.post);
    }

    if(notification?.comment) {
        object.comment = new Types.ObjectId(notification.comment);
    }

    if (Object.keys(object).length > 0) {
        const updated_user = await User.findOneAndUpdate(
            { _id: user_id },
            {
                $push: {
                    notifications: {
                        type: notification.type,
                        ...object
                    }
                }
            },
            { new: true }
        );

        return updated_user
    }
}

async function editProfileById(user_id, update_fields) {
    return User.findByIdAndUpdate(
        { _id: user_id },
        { $set: update_fields },
        { new: true }
    ).lean();
}

async function removeNotification(filter) {
    return User.updateMany(
        {},
        {
            $pull: {
                notifications: filter
            }
        }
    )
}

module.exports = {
    addPostToSaved,
    removePostFromSaved,
    removePostFromSavedForUsers,
    readNotificationsByUserId,
    addNotificationToUserById,
    editProfileById,
    removeNotification
}