function parsePagination(query = {}, { defaultLimit = 10, maxLimit = 50 } = {}) {
    let page = Number.parseInt(query.page, 10)
    let limit = Number.parseInt(query.limit, 10)

    if (!Number.isInteger(page) || page < 1) {
        page = 1
    }

    if (!Number.isInteger(limit) || limit < 1) {
        limit = defaultLimit
    }

    if (limit > maxLimit) {
        limit = maxLimit
    }

    return {
        page,
        limit,
        skip: (page - 1) * limit
    }
}

function omitPaginationFields(query = {}) {
    const params = { ...query }
    delete params.page
    delete params.limit
    delete params.expand
    return params
}

function paginationMeta({ page, limit, total }) {
    const pages = total > 0 ? Math.ceil(total / limit) : 0

    return {
        page,
        limit,
        total,
        pages
    }
}

function normalizeIdList(value) {
    if (value === undefined || value === null || value === "") {
        return []
    }

    const raw = Array.isArray(value) ? value : [value]

    return raw
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean)
}

function asObjectIdFilter(value) {
    const ids = normalizeIdList(value)

    if (!ids.length) {
        return undefined
    }

    if (ids.length === 1) {
        return ids[0]
    }

    return { $in: ids }
}

module.exports = {
    parsePagination,
    omitPaginationFields,
    paginationMeta,
    normalizeIdList,
    asObjectIdFilter
}
