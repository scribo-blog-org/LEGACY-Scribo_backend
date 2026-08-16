const NotFoundError = require("../../errors/NotFoundError")
const BadRequestError = require("../../errors/BadRequestError")
const UnAuthorizedError = require("../../errors/UnAuthorizedError")
const AppError = require("../../errors/AppError")
 
const { comparePassword } = require("./utils/password")
const { getEmailByGoogleToken } = require("./utils/google")
const { encode } = require("./utils/jwt")

const { getUserByQuery } = require('../../db/users.db')

async function loginByGoogle(google_token) {
    if(!google_token) {
        throw new AppError({ message: "Google token is required for this operation" })
    }

    const result = await getEmailByGoogleToken(google_token)

    if(!result) {
        throw new BadRequestError({
            errors: {
                body: {
                    google_token: {
                        message: "Google token is invalid",
                        data: google_token
                    }
                }
            }
        })
    }

    const user = await getUserByQuery({ email: result })

    if(!user) 
    {
        throw new NotFoundError({ message: "User with this email is not found" })
    }

    return {
        token: encode(user._id)
    }
}

async function loginByUserName({ userName, password }) {
    const user = await getUserByQuery({
        $or: [
            { email: userName.toLowerCase() },
            { nick_name: userName }
        ]
    }, { with_password: true });

    if(!user) {
        throw new NotFoundError({ message: "User with this email or nick name is not found" })
    }

    if(!await comparePassword(password, user.password)) {
        throw new UnAuthorizedError({ message: "Invalid password or login" })
    }

    return {
        token: encode(user._id)
    }
}

module.exports = {
    loginByGoogle,
    loginByUserName
}