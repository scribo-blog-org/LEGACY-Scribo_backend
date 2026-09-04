const Logs = require("../models/Log")
const mongoose = require("mongoose")

function idMatch(path, value) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return { [path]: value }
    }

    return {
        [path]: {
            $in: [value, new mongoose.Types.ObjectId(value)]
        }
    }
}

async function getLogsByQuery(query = {}, options = {}) {
    let request = Logs.find(query).sort({ date_time: -1 })

    if (options.skip != null) {
        request = request.skip(options.skip)
    }

    if (options.limit != null) {
        request = request.limit(options.limit)
    }

    return request.lean()
}

async function countLogsByQuery(query = {}) {
    return Logs.countDocuments(query)
}

async function getAllLogs() {
    return Logs.find().sort({ date_time: -1 }).lean()
}

module.exports = {
    getAllLogs,
    getLogsByQuery,
    countLogsByQuery,
    idMatch
}
