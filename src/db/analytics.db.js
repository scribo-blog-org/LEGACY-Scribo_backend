const PageView = require("../models/PageView")
const User = require("../models/User")
const Post = require("../models/Post")
const PostComment = require("../models/PostComment")
const Log = require("../models/Log")

const DEDUPE_MS = 8000
const SESSION_MS = 30 * 60 * 1000

async function insertPageView(doc) {
    const recent = await PageView.findOne({
        visitor_id: doc.visitor_id,
        path: doc.path,
        created_at: { $gte: new Date(Date.now() - DEDUPE_MS) }
    }).lean()

    if (recent) {
        return recent
    }

    const lastVisit = await PageView.findOne({ visitor_id: doc.visitor_id })
        .sort({ created_at: -1 })
        .select({ created_at: 1 })
        .lean()

    const is_entry = !lastVisit || (Date.now() - new Date(lastVisit.created_at).getTime() > SESSION_MS)

    const created = await PageView.create({
        ...doc,
        is_entry
    })

    return created.toObject()
}

function dayKeyExpr(field) {
    return {
        $dateToString: {
            format: "%Y-%m-%d",
            date: `$${field}`,
            timezone: "UTC"
        }
    }
}

async function countDocumentsSince(model, field, from) {
    return model.countDocuments({ [field]: { $gte: from } })
}

async function groupCountByDay(model, field, from) {
    return model.aggregate([
        { $match: { [field]: { $gte: from } } },
        {
            $group: {
                _id: dayKeyExpr(field),
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
}

async function uniqueVisitorsByDay(from) {
    return PageView.aggregate([
        { $match: { created_at: { $gte: from } } },
        {
            $group: {
                _id: {
                    day: dayKeyExpr("created_at"),
                    visitor: "$visitor_id"
                }
            }
        },
        {
            $group: {
                _id: "$_id.day",
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
}

async function uniqueUsersByDay(from) {
    return PageView.aggregate([
        {
            $match: {
                created_at: { $gte: from },
                user: { $ne: null }
            }
        },
        {
            $group: {
                _id: {
                    day: dayKeyExpr("created_at"),
                    user: "$user"
                }
            }
        },
        {
            $group: {
                _id: "$_id.day",
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
}

async function distinctCount(model, field, match) {
    const rows = await model.distinct(field, match)
    return rows.filter(Boolean).length
}

async function topPaths(from, limit = 8) {
    return PageView.aggregate([
        { $match: { created_at: { $gte: from } } },
        {
            $group: {
                _id: "$path",
                visits: { $sum: 1 },
                unique_visitors: { $addToSet: "$visitor_id" }
            }
        },
        {
            $project: {
                path: "$_id",
                visits: 1,
                unique_visitors: { $size: "$unique_visitors" },
                _id: 0
            }
        },
        { $sort: { visits: -1 } },
        { $limit: limit }
    ])
}

async function activityByType(from) {
    return Log.aggregate([
        { $match: { date_time: { $gte: from } } },
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ])
}

async function entriesByDay(from) {
    return PageView.aggregate([
        { $match: { created_at: { $gte: from }, is_entry: true } },
        {
            $group: {
                _id: dayKeyExpr("created_at"),
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])
}

async function topCities(from, limit = 12) {
    return PageView.aggregate([
        { $match: { created_at: { $gte: from } } },
        {
            $group: {
                _id: {
                    city: { $ifNull: ["$city", "Неизвестно"] },
                    country: { $ifNull: ["$country", ""] }
                },
                visits: { $sum: 1 },
                entries: { $sum: { $cond: ["$is_entry", 1, 0] } },
                unique_visitors: { $addToSet: "$visitor_id" }
            }
        },
        {
            $project: {
                city: "$_id.city",
                country: "$_id.country",
                visits: 1,
                entries: 1,
                unique_visitors: { $size: "$unique_visitors" },
                _id: 0
            }
        },
        { $sort: { entries: -1, visits: -1 } },
        { $limit: limit }
    ])
}

async function recentEntries(from, limit = 20) {
    return PageView.find({
        created_at: { $gte: from },
        is_entry: true
    })
        .sort({ created_at: -1 })
        .limit(limit)
        .select({ created_at: 1, ip: 1, city: 1, region: 1, country: 1, path: 1 })
        .lean()
}

async function likesTotal() {
    const [posts, comments] = await Promise.all([
        Post.aggregate([
            { $project: { n: { $size: { $ifNull: ["$likes", []] } } } },
            { $group: { _id: null, count: { $sum: "$n" } } }
        ]),
        PostComment.aggregate([
            { $project: { n: { $size: { $ifNull: ["$likes", []] } } } },
            { $group: { _id: null, count: { $sum: "$n" } } }
        ])
    ])

    return (posts[0]?.count || 0) + (comments[0]?.count || 0)
}

module.exports = {
    insertPageView,
    countDocumentsSince,
    groupCountByDay,
    uniqueVisitorsByDay,
    uniqueUsersByDay,
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
}
