const { decode } = require('./auth/utils/jwt')

const { getUserByQuery, getUserById } = require('../db/users.db')
const { readNotificationsByUserId, editProfileById } = require('../db/profile')

const { deleteFile, uploadImage } = require('./aws.services');
const { comparePassword, setPasswordHash } = require('./auth/utils/password')
const { sendEmail } = require('./auth/utils/email')
const passwordChangedTemplate = require('./auth/templates/password_changed')

const rolePermissions = require('../authorization/rolePermissions');
const roleManagement = require('../authorization/roleManagement');

const UnAuthorizedError = require('../errors/UnAuthorizedError');
const ConflictError = require('../errors/ConflictError')
const BadRequestError = require('../errors/BadRequestError')
const AppError = require('../errors/AppError')

function withAccessRole(user, auth) {
    const role = auth?.role || user.role
    const data = {
        ...user,
        role,
        permissions: rolePermissions[role] ?? [],
    }

    if (roleManagement[role]) {
        data.role_management = roleManagement[role]
    }
    else {
        delete data.role_management
    }

    return data
}

async function getProfile(id) {
    const user = await getUserById(id, { with_saved_posts: true, with_notifications: true })

    if(!user) {
        throw new UnAuthorizedError()
    }

    return withAccessRole(user)
}

async function editProfile(profile, data) {
    const stored = await getUserById(profile._id)

    if (!stored) {
        throw new UnAuthorizedError()
    }

    if(data.nick_name) {
        const nick_owner  = await getUserByQuery({ nick_name: data.nick_name })
        
        if(nick_owner && String(nick_owner._id) !== String(profile._id)) {
            throw new ConflictError({ message: "Nick name is already used by another user!" })
        }
    }

    if(Object.keys(data).includes("avatar")) {
        if(stored.avatar) {
            await deleteFile(stored.avatar)
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

    return withAccessRole(result, profile)
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

function fieldError(field, message) {
    return new BadRequestError({
        errors: {
            body: {
                [field]: {
                    message,
                    data: ""
                }
            }
        }
    })
}

async function notifyPasswordChanged(user) {
    if (!user?.email) {
        return
    }

    const settingsUrl = process.env.FRONTEND_ORIGIN
        ? `${String(process.env.FRONTEND_ORIGIN).replace(/\/$/, "")}/settings?tab=sessions`
        : ""

    const time = new Date().toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Kyiv"
    })

    try {
        await sendEmail({
            to: user.email,
            subject: "Пароль аккаунта Scribo изменён",
            html: passwordChangedTemplate({
                nickName: user.nick_name,
                time,
                settingsUrl
            })
        })
    }
    catch (error) {
        console.error("Failed to send password change email", error)
    }
}

async function changePassword(profile, { current_password, new_password, new_password_confirm }) {
    if (new_password !== new_password_confirm) {
        throw fieldError("new_password_confirm", "Пароли не совпадают")
    }

    if (current_password === new_password) {
        throw fieldError("new_password", "Новый пароль должен отличаться от текущего")
    }

    const user = await getUserById(profile._id, { with_password: true })

    if (!user) {
        throw new UnAuthorizedError()
    }

    if (!user.password) {
        throw fieldError("current_password", "Для этого аккаунта нельзя сменить пароль")
    }

    if (!await comparePassword(current_password, user.password)) {
        throw fieldError("current_password", "Неверный текущий пароль")
    }

    await editProfileById(profile._id, { password: setPasswordHash(new_password) })
    notifyPasswordChanged(user)
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
    changePassword,
    readNotifications,
    getAuthProfile,
    notifyPasswordChanged,
    withAccessRole
}