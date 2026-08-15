const jwt = require("jsonwebtoken")

function encode(user_id) {
    const key = process.env.JWTKEY

    return jwt.sign(
        { user_id: user_id },
        key,
        {}
    )
}

function decode(token) {
    const key = process.env.JWTKEY

    try {
        const decoded = jwt.verify(token, key);
        
        if (decoded && decoded.user_id) {
            return decoded.user_id
        }

        else {
            return null
        }
    }
    catch (err) {
        return null
    }
}

module.exports = {
    encode,
    decode
}