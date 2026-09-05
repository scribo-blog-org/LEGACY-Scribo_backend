const { Types } = require("mongoose")
const PERMISSIONS = require("../authorization/permissions")
const { actorFromProfile, assertPermission } = require("../authorization/roleChecks")
const { clientIp, lookupVisitorGeo } = require("./geo")
const {
    insertPageView,
    countDocumentsSince,
    groupCountByDay,
    uniqueVisitorsByDay,
    distinctCount,
    topPaths,
    activityByType,
    likesTotal,
    entriesByDay,
    topCities,
    recentEntries,
    PageView,
    User,
    Post,
    PostComment,
    Log
} = require("../db/analytics.db")

function utcDayString(date) {
    return date.toISOString().slice(0, 10)
}

function rangeStart(days) {
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    start.setUTCDate(start.getUTCDate() - (days - 1))
    return start
}

function fillDays(days, maps) {
    const start = rangeStart(days)
    const series = []

    for (let i = 0; i < days; i += 1) {
        const day = new Date(start)
        day.setUTCDate(start.getUTCDate() + i)
        const key = utcDayString(day)
        const point = { date: key }

        for (const [name, map] of Object.entries(maps)) {
            point[name] = map.get(key) || 0
        }

        series.push(point)
    }

    return series
}

function toMap(rows) {
    const map = new Map()

    for (const row of rows) {
        map.set(row._id, row.count)
    }

    return map
}

function parseDays(value) {
    const days = Number.parseInt(value, 10)

    if ([7, 14, 30].includes(days)) {
        return days
    }

    return 14
}

function sanitizePath(path) {
    const raw = String(path || "").split("?")[0].split("#")[0].trim()

    if (!raw.startsWith("/")) {
        return "/"
    }

    return raw.slice(0, 200)
}

function profileUserId(profile) {
    const id = profile?._id || profile?.id

    if (!id || !Types.ObjectId.isValid(String(id))) {
        return null
    }

    return new Types.ObjectId(String(id))
}

function authorizedMatch(base) {
    return {
        ...base,
        user: { $exists: true, $ne: null }
    }
}

async function trackVisit(body, profile, req) {
    const path = sanitizePath(body.path)
    const visitor_id = String(body.visitor_id || "").slice(0, 64)
    const referrer = String(body.referrer || "").slice(0, 500)
    const user = profileUserId(profile)
    const ip = clientIp(req)
    const geo = await lookupVisitorGeo(req, body)

    return insertPageView({
        path,
        visitor_id,
        referrer,
        user,
        ip: geo.ip || ip,
        city: geo.city,
        region: geo.region,
        country: geo.country
    })
}

async function getDashboard(query, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.VIEW_LOGS,
        "You don't have permission to view analytics"
    )

    const days = parseDays(query.days)
    const from = rangeStart(days)
    const previousFrom = rangeStart(days * 2)
    const previousMatch = { created_at: { $gte: previousFrom, $lt: from } }
    const currentMatch = { created_at: { $gte: from } }

    const [
        pageviews,
        entries,
        unique_visitors,
        unique_users,
        authorized_visits,
        previousPageviews,
        previousEntries,
        previousUnique,
        previousUniqueUsers,
        previousAuthorized,
        new_users,
        new_posts,
        new_comments,
        activity_events,
        registered_users,
        posts,
        comments,
        likes,
        pageviewSeries,
        entrySeries,
        uniqueSeries,
        paths,
        cities,
        recent,
        activity
    ] = await Promise.all([
        PageView.countDocuments(currentMatch),
        PageView.countDocuments({ ...currentMatch, is_entry: true }),
        distinctCount(PageView, "visitor_id", currentMatch),
        distinctCount(PageView, "user", authorizedMatch(currentMatch)),
        PageView.countDocuments(authorizedMatch(currentMatch)),
        PageView.countDocuments(previousMatch),
        PageView.countDocuments({ ...previousMatch, is_entry: true }),
        distinctCount(PageView, "visitor_id", previousMatch),
        distinctCount(PageView, "user", authorizedMatch(previousMatch)),
        PageView.countDocuments(authorizedMatch(previousMatch)),
        countDocumentsSince(User, "created_date", from),
        countDocumentsSince(Post, "created_date", from),
        countDocumentsSince(PostComment, "created_date", from),
        countDocumentsSince(Log, "date_time", from),
        User.estimatedDocumentCount(),
        Post.estimatedDocumentCount(),
        PostComment.estimatedDocumentCount(),
        likesTotal(),
        groupCountByDay(PageView, "created_at", from),
        entriesByDay(from),
        uniqueVisitorsByDay(from),
        topPaths(from),
        topCities(from),
        recentEntries(from),
        activityByType(from)
    ])

    return {
        days,
        totals: {
            entries,
            unique_visitors,
            unique_users,
            authorized_visits,
            pageviews,
            new_users,
            new_posts,
            new_comments,
            activity_events,
            registered_users,
            posts,
            comments,
            likes,
            entries_prev: previousEntries,
            unique_visitors_prev: previousUnique,
            unique_users_prev: previousUniqueUsers,
            authorized_visits_prev: previousAuthorized,
            pageviews_prev: previousPageviews
        },
        series: fillDays(days, {
            entries: toMap(entrySeries),
            unique_visitors: toMap(uniqueSeries),
            pageviews: toMap(pageviewSeries)
        }),
        top_paths: paths,
        cities,
        recent_entries: recent,
        activity: activity.map((item) => ({
            type: item._id,
            count: item.count
        }))
    }
}

module.exports = {
    trackVisit,
    getDashboard
}
