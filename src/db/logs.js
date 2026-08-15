const Logs = require("../models/Log")

const getAllLogs = async () => {
    return Logs.find().sort({ createdAt: -1 }).lean()
}

module.exports = {
    getAllLogs
}