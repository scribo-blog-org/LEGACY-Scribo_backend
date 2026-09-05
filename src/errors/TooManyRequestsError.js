const AppError = require("./AppError")

class TooManyRequestsError extends AppError {
    constructor({ message = "Too many requests. Try again later.", errors = null } = {}) {
        super({ message, errors, status: 429, isOperational: true });
    }
}

module.exports = TooManyRequestsError
