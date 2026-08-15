const ConflictError = require("../../errors/ConflictError")
const AppError = require("../../errors/AppError")
const BadRequestError = require("../../errors/BadRequestError")
const UnAuthorizedError = require("../../errors/UnAuthorizedError")

const { uploadImage } = require(".././aws.services")
const { setPasswordHash } = require("./utils/password")
const { getEmailByGoogleToken } = require("./utils/google")
const { confirmEmailCode } = require("./verification.service")

const { deleteVerificationCode } = require("../../db/email")
const { getUserByQuery, createNewUser } = require('../../db/users.db')
const { editProfileById } = require("../../db/profile")

async function register({
    nickName,
    description,
    password,
    avatar,
    email
}){
    if(!nickName || !password || !email) {
        throw new AppError({ message: "Missing some data for register" });
    }

    if((await getUserByQuery({ "email": email }))) {
        throw new ConflictError({ message: "User with this email is exists" })
    }

    if((await getUserByQuery({ "nick_name": nickName }))) {
        throw new ConflictError({
            message: "User with this nick name is exists",
            errors: {
                body: {
                    nick_name: {
                        message: "This nick name is already taken",
                        data: nickName
                    }
                }
            } 
        })
    }

    let upload_image_result

    let newUser = await createNewUser({
        nick_name: nickName,
        password: setPasswordHash(password),
        description: description,
        email: email
    })

    if(avatar) {
        upload_image_result = await uploadImage(avatar, "avatar", newUser._id.toString())

        if(!upload_image_result) {
            throw new AppError({ message: "Error to upload avatar image" })
        }
    }
    
    const img = upload_image_result ? upload_image_result : null

    delete newUser.password

    await editProfileById(
        newUser._id,
        {
            avatar: img
        }
    );

    newUser.avatar = img;

    global.Logger.log({
        type: "register",
        message: `User ${newUser.nick_name} has registered`,
        data: {
            user: newUser._id
        }
    })

    return newUser
}

async function registerByGoogle({
    nickName,
    description,
    password,
    avatar,
    googleToken
}) {
    if(!googleToken) {
        throw new AppError({ message: "Google token is required for this operation" })
    }

    const result = await getEmailByGoogleToken(googleToken)

    if(!result) { 
        throw new BadRequestError({
            errors: {
                body: {
                    googleToken: {
                        message: "Google token is invalid",
                        data: googleToken
                    }
                }
            }
        })
    }

    return await register({
        nickName: nickName,
        description: description,
        password: password,
        avatar: avatar,
        email: result
    })
}

async function registerByEmail({
    nickName,
    description,
    password,
    avatar,
    email,
    emailCode
}) {
    if(!email || !emailCode) {
        throw new AppError({ message: "Email and email code are required for this operation" })
    }

    const result = await confirmEmailCode(email, emailCode)

    if(!result) {
        throw new UnAuthorizedError({ message: "Invalid email or code" })
    }

    const registerResult = await register({
        nickName: nickName,
        description: description,
        password: password,
        avatar: avatar,
        email: email
    })

    await deleteVerificationCode(email)
    return registerResult
}

module.exports = {
    registerByGoogle,
    registerByEmail
}