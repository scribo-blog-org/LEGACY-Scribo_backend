const SupportRequest = require('../models/SupportRequest')

async function createSupportRequest(data) {
    const created = await SupportRequest.create(data)
    return created.toObject()
}

async function countSupportRequestsByQuery(query = {}) {
    return SupportRequest.countDocuments(query)
}

async function getSupportRequestsByQuery(query = {}, options = {}) {
    const sort = options.sort || { created_date: -1 }
    let request = SupportRequest.find(query).sort(sort)

    if (options.skip != null) {
        request = request.skip(options.skip)
    }

    if (options.limit != null) {
        request = request.limit(options.limit)
    }

    return request.lean()
}

async function getSupportRequestById(id) {
    return SupportRequest.findById(id).lean()
}

async function getSupportRequestByAccessKey(access_key) {
    return SupportRequest.findOne({ access_key }).lean()
}

async function addSupportReply(id, reply) {
    return SupportRequest.findByIdAndUpdate(
        id,
        {
            $push: { replies: reply },
            $set: { updated_date: new Date() }
        },
        { new: true }
    ).lean()
}

async function updateSupportRequestStatus(id, status) {
    return SupportRequest.findByIdAndUpdate(
        id,
        {
            $set: {
                status,
                updated_date: new Date()
            }
        },
        { new: true }
    ).lean()
}

async function setSupportRequestAccessKey(id, access_key) {
    return SupportRequest.findByIdAndUpdate(
        id,
        { $set: { access_key } },
        { new: true }
    ).lean()
}

module.exports = {
    createSupportRequest,
    countSupportRequestsByQuery,
    getSupportRequestsByQuery,
    getSupportRequestById,
    getSupportRequestByAccessKey,
    addSupportReply,
    updateSupportRequestStatus,
    setSupportRequestAccessKey
}
