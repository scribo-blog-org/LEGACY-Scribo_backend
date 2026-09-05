const bcrypt = require("bcryptjs")

function passwordRounds() {
    const rounds = Number.parseInt(process.env.PASSWORD_SALT, 10)

    if (!Number.isFinite(rounds) || rounds < 4 || rounds > 31) {
        return 10
    }

    return rounds
}

function setPasswordHash(password) {
    return bcrypt.hashSync(password, passwordRounds())
}

function comparePassword(password, from_db) {    
    return bcrypt.compare(password, from_db)
}

module.exports = {
    setPasswordHash,
    comparePassword
}