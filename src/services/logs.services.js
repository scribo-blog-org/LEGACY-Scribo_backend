const { getLogsByQuery, countLogsByQuery, idMatch } = require('../db/logs')
const { parsePagination, omitPaginationFields, paginationMeta } = require('../utils/pagination')
const PERMISSIONS = require('../authorization/permissions')
const { actorFromProfile, assertPermission } = require('../authorization/roleChecks')

const getLogs = async (params = {}, profile) => {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.VIEW_LOGS,
        "You don't have permission to view logs"
    )

    const { page, limit, skip } = parsePagination(params, { defaultLimit: 9, maxLimit: 50 })
    const query = omitPaginationFields(params)
    const filter = {}

    if (query.user) {
        Object.assign(filter, idMatch('data.user', query.user))
    }

    if (query.post) {
        Object.assign(filter, idMatch('data.post', query.post))
    }

    if (query.category) {
        Object.assign(filter, idMatch('data.category', query.category))
    }

    if (query.support_request) {
        Object.assign(filter, idMatch('data.support_request', query.support_request))
    }

    if (query.type) {
        filter.type = query.type
    }

    const total = await countLogsByQuery(filter)
    const items = await getLogsByQuery(filter, { skip, limit })

    return {
        items,
        pagination: paginationMeta({ page, limit, total })
    }
}

module.exports = {
    getLogs
}
