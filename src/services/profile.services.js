const { decode } = require('./auth/utils/jwt')
const { getUserByQuery } = require('../db/users.db')
const { readNotificationsByUserId, editProfileById } = require('../db/profile')
const { deleteFile, uploadImage } = require('./aws.services');
const rolePermissions = require('../authorization/rolePermissions');
const roleManagement = require('../authorization/roleManagement');
const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError')

async function getProfile(id) {
    const user = await getUserById(id, { with_saved_posts: true, with_notifications: true })

    if(!user) {
        throw new UnAuthorizedError()
    }

    const data = {
        ...user,
        permissions: rolePermissions[user.role] ?? [],
    } 

    if(roleManagement[user.role]) {
        data.role_management = roleManagement[user.role]
    }

    return data
}

async function editProfile(profile, data) {
    if(data.nick_name) {
        const nick_owner  = await getUserByQuery({ nick_name: data.nick_name })
        
        if(nick_owner && nick_owner._id !== String(profile._id)) {
            throw new ConflictError({ message: "Nick name is already used by another user!" })
        }
    }

    if(Object.keys(data).includes("avatar")) {
        if(profile.avatar) {
            await deleteFile(profile.avatar)
        }

        if(data.avatar !== undefined && data.avatar !== null) { 
            const upload_image_result = await uploadImage(data.avatar, "avatar", String(profile._id))
            if(!upload_image_result) {
                throw new AppError({ message: "Error to upload image to storage!" })
            }
            data.avatar = upload_image_result
        }
        else {
            data.avatar = null
        }
    }

    const result = await editProfileById(profile._id, data)

    let result_data = {
        ...result,
        permissions: rolePermissions[result.role] ?? [],
    }

    if(roleManagement[result.role]) {
        result_data.role_management = roleManagement[result.role]
    }

    return result_data
}

async function readNotifications(profile) {
    const user = await getUserById(profile._id, { with_notifications: true })
    
    if(!user) {
        throw new UnAuthorizedError()
    }

    const result = await readNotificationsByUserId(profile._id)

    return {
        notifications: result.notifications
    }
}     

async function getAuthProfile(token) {
    const user_id = decode(token)
    const user = await getUserById(user_id, { with_notifications: true })

    if(!user) {
        throw new UnAuthorizedError()
    }

    return user
}

module.exports = {
    getProfile,
    editProfile,
    readNotifications,
    getAuthProfile
}