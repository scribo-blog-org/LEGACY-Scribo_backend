const { clientIp } = require("../services/geo")
const TooManyRequestsError = require("../errors/TooManyRequestsError")

const buckets = new Map()

function prune(now) {
    if (buckets.size < 2000) {
        return
    }

    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) {
            buckets.delete(key)
        }
    }
}

function consume(key, windowMs, max) {
    const now = Date.now()
    prune(now)

    let bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + windowMs }
        buckets.set(key, bucket)
    }

    bucket.count += 1
    return bucket.count <= max
}

function rateLimit({ name, windowMs, max, by = "ip" }) {
    return (req, _res, next) => {
        const ip = clientIp(req) || "unknown"
        const email = String(req.body?.email || "").trim().toLowerCase()
        const key = by === "email"
            ? `${name}:email:${email || "missing"}`
            : `${name}:ip:${ip}`

        if (!consume(key, windowMs, max)) {
            return next(new TooManyRequestsError())
        }

        next()
    }
}

module.exports = rateLimit
