const crypto = require('crypto')
const { parsePagination, paginationMeta } = require('../utils/pagination')
const PERMISSIONS = require('../authorization/permissions')
const { actorFromProfile, assertPermission, hasPermissions } = require('../authorization/roleChecks')
const {
    createSupportRequest,
    countSupportRequestsByQuery,
    getSupportRequestsByQuery,
    getSupportRequestById,
    getSupportRequestByAccessKey,
    addSupportReply,
    updateSupportRequestStatus,
    setSupportRequestAccessKey
} = require('../db/support')
const { getUsersByIds, getUserById } = require('../db/users.db')
const { addNotificationToUserById } = require('../db/profile')
const { sendEmail } = require('./auth/utils/email')
const supportEmailTemplate = require('./auth/templates/support_email')
const NotFoundError = require('../errors/NotFoundError')
const BadRequestError = require('../errors/BadRequestError')
const ForbiddenError = require('../errors/ForbiddenError')

const KIND_LABELS = {
    complaint: 'Жалоба',
    request: 'Запрос',
    help: 'Помощь'
}

const STATUS_LABELS = {
    new: 'Новый',
    in_review: 'На рассмотрении',
    reviewed: 'Рассмотрено'
}

const SORT_FIELDS = {
    created_date: 'created_date',
    updated_date: 'updated_date'
}

function normalizeStatus(status) {
    if (status === 'open') {
        return 'new'
    }

    if (status === 'answered') {
        return 'reviewed'
    }

    return status
}

function statusFilter(status) {
    const normalized = normalizeStatus(status)

    if (normalized === 'new') {
        return { status: { $in: ['new', 'open'] } }
    }

    if (normalized === 'reviewed') {
        return { status: { $in: ['reviewed', 'answered'] } }
    }

    if (normalized === 'in_review') {
        return { status: 'in_review' }
    }

    return {}
}

function requestPageUrl(access_key) {
    const origin = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_ORIGIN_DEV || ''

    if (!origin || !access_key) {
        return null
    }

    return `${origin.replace(/\/$/, '')}/support/${access_key}`
}

function previewMessage(message) {
    const text = String(message || '').trim()
    if (text.length <= 140) {
        return text
    }
    return `${text.slice(0, 140).trim()}…`
}

function toListItem(item) {
    return {
        _id: item._id,
        access_key: item.access_key,
        email: item.email,
        kind: item.kind,
        status: normalizeStatus(item.status),
        message_preview: previewMessage(item.message),
        replies_count: item.replies?.length || 0,
        created_date: item.created_date,
        updated_date: item.updated_date
    }
}

async function toDetail(item, { includeStatus = false } = {}) {
    const adminIds = [...new Set((item.replies || []).map((reply) => reply.admin).filter(Boolean))]
    const admins = adminIds.length ? await getUsersByIds(adminIds) : []
    const adminsById = Object.fromEntries(admins.map((admin) => [String(admin._id), admin]))

    const replies = (item.replies || []).map((reply) => {
        const admin = adminsById[String(reply.admin)] || null
        const author_type = reply.author_type || (reply.admin ? 'staff' : 'requester')

        return {
            _id: reply._id,
            text: reply.text,
            created_date: reply.created_date,
            author_type,
            admin: author_type === 'staff' && admin
                ? {
                    _id: admin._id,
                    nick_name: admin.nick_name,
                    avatar: admin.avatar,
                    role: admin.role
                }
                : null
        }
    })

    const detail = {
        _id: item._id,
        access_key: item.access_key,
        email: item.email,
        kind: item.kind,
        message: item.message,
        created_date: item.created_date,
        updated_date: item.updated_date,
        anonymous: isAnonymousTicket(item),
        closed: isClosedTicket(item),
        can_reply: false,
        is_owner: false,
        replies
    }

    if (includeStatus) {
        detail.status = normalizeStatus(item.status)
    }

    return detail
}

function canManageSupport(profile) {
    return hasPermissions(actorFromProfile(profile), PERMISSIONS.MANAGE_SUPPORT)
}

function withAccessFlags(detail, item, profile) {
    const staff = canManageSupport(profile)
    const owner = isTicketOwner(item, profile)
    const closed = isClosedTicket(item)
    const anonymous = isAnonymousTicket(item)

    return {
        ...detail,
        anonymous,
        closed,
        is_owner: owner,
        can_reply: !closed && (staff || (owner && !anonymous)),
        ...(staff || owner ? { status: normalizeStatus(item.status) } : {}),
        ...(staff ? { email: item.email } : { email: undefined })
    }
}

function isAnonymousTicket(item) {
    if (item.anonymous === false) {
        return false
    }

    if (item.anonymous === true) {
        return true
    }

    return !item.user
}

function isClosedTicket(item) {
    return normalizeStatus(item.status) === 'reviewed'
}

function isTicketOwner(item, profile) {
    const actor = actorFromProfile(profile)

    if (!item.user || !actor.id) {
        return false
    }

    return String(item.user) === String(actor.id)
}

async function notifyTicketOwner(item, notification) {
    if (!item.user || isAnonymousTicket(item)) {
        return
    }

    try {
        await addNotificationToUserById(item.user, notification)
    }
    catch (error) {
        console.error('Failed to notify support request owner', error)
    }
}

function notifyAnonymousByEmail(item, payload) {
    if (!isAnonymousTicket(item) || !item.email) {
        return
    }

    void sendSupportMail({
        ...payload,
        to: item.email,
        url: requestPageUrl(item.access_key)
    })
}

async function sendSupportMail({ to, title, intro, message, url }) {
    try {
        await sendEmail({
            to,
            subject: title,
            html: supportEmailTemplate({ title, intro, message, url })
        })
    }
    catch (error) {
        console.error('Failed to send support email', error)
    }
}

function assertReplyText(text) {
    const message = String(text || '').trim()

    if (!message) {
        throw new BadRequestError({
            errors: {
                body: {
                    text: {
                        message: 'Reply text must be not empty!',
                        data: text
                    }
                }
            }
        })
    }

    return message
}

async function appendReply(existing, { text, author_type, adminId }) {
    const updated = await addSupportReply(existing._id, {
        text,
        author_type,
        admin: adminId || null,
        created_date: new Date()
    })

    return updated
}

function actorUserId(profile) {
    return profile?._id || profile?.id || null
}

function logSupport(type, message, data) {
    if (!global.Logger) {
        return
    }

    void global.Logger.log({ type, message, data })
}

function supportLogPayload(item, extra = {}) {
    return {
        support_request: item._id,
        access_key: item.access_key,
        kind: item.kind,
        ...extra
    }
}

function assertCanReply(item, profile) {
    if (isClosedTicket(item)) {
        throw new ForbiddenError({ message: 'This request is closed' })
    }

    if (canManageSupport(profile)) {
        return 'staff'
    }

    if (isAnonymousTicket(item) || !isTicketOwner(item, profile)) {
        throw new ForbiddenError({ message: "You don't have permission to reply to this request" })
    }

    return 'requester'
}

async function createRequest(body, profile) {
    const kind = body.kind
    const message = String(body.message || '').trim()
    const access_key = crypto.randomBytes(32).toString('hex')
    const userId = profile?._id || profile?.id || null
    const authenticated = Boolean(userId)

    let email = String(body.email || '').trim().toLowerCase()

    if (authenticated) {
        const user = await getUserById(userId)

        if (!user?.email) {
            throw new BadRequestError({ message: 'Account email is required to create a request' })
        }

        email = String(user.email).trim().toLowerCase()
    } else if (!email) {
        throw new BadRequestError({
            errors: {
                body: {
                    email: {
                        message: 'Missing email!',
                        data: ''
                    }
                }
            }
        })
    }

    const created = await createSupportRequest({
        email,
        kind,
        message,
        status: 'new',
        access_key,
        anonymous: !authenticated,
        user: authenticated ? userId : null,
        created_date: new Date(),
        updated_date: new Date(),
        replies: []
    })

    const kindLabel = KIND_LABELS[kind] || kind

    if (!authenticated) {
        void sendSupportMail({
            to: email,
            title: 'Мы приняли ваш запрос',
            intro: `Спасибо. Мы получили ваше обращение (${kindLabel}). Ответы команды можно посмотреть на странице запроса.`,
            message,
            url: requestPageUrl(access_key)
        })
    }

    logSupport(
        'create_support_request',
        authenticated
            ? `User created support request ${created._id}`
            : `Guest created support request ${created._id}`,
        supportLogPayload(created, {
            user: userId,
            anonymous: !authenticated,
            ...(authenticated ? {} : { email })
        })
    )

    return {
        _id: created._id,
        access_key
    }
}

async function listRequests(params = {}, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.MANAGE_SUPPORT,
        "You don't have permission to view support requests"
    )

    const { page, limit, skip } = parsePagination(params, { defaultLimit: 9, maxLimit: 50 })
    const filter = {}

    if (params.status) {
        Object.assign(filter, statusFilter(params.status))
    }

    if (params.kind) {
        filter.kind = params.kind
    }

    const sortField = SORT_FIELDS[params.sort] || 'created_date'
    const sortOrder = params.order === 'asc' ? 1 : -1

    const total = await countSupportRequestsByQuery(filter)
    const items = await getSupportRequestsByQuery(filter, {
        skip,
        limit,
        sort: { [sortField]: sortOrder }
    })

    return {
        items: items.map(toListItem),
        pagination: paginationMeta({ page, limit, total })
    }
}

async function listMyRequests(params = {}, profile) {
    const actor = actorFromProfile(profile)

    if (!actor.id) {
        throw new ForbiddenError({ message: 'You must be logged in to view your requests' })
    }

    const { page, limit, skip } = parsePagination(params, { defaultLimit: 9, maxLimit: 50 })
    const filter = { user: actor.id }

    const total = await countSupportRequestsByQuery(filter)
    const items = await getSupportRequestsByQuery(filter, {
        skip,
        limit,
        sort: { created_date: -1 }
    })

    return {
        items: items.map((item) => {
            const row = toListItem(item)
            delete row.email
            return row
        }),
        pagination: paginationMeta({ page, limit, total })
    }
}

async function getRequest(id, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.MANAGE_SUPPORT,
        "You don't have permission to view support requests"
    )

    const item = await getSupportRequestById(id)

    if (!item) {
        throw new NotFoundError({ message: 'Support request not found' })
    }

    if (!item.access_key) {
        const withKey = await setSupportRequestAccessKey(id, crypto.randomBytes(32).toString('hex'))
        return withAccessFlags(await toDetail(withKey), withKey, profile)
    }

    return withAccessFlags(await toDetail(item), item, profile)
}

async function getPublicRequest(access_key, profile) {
    const item = await getSupportRequestByAccessKey(access_key)

    if (!item) {
        throw new NotFoundError({ message: 'Support request not found' })
    }

    return withAccessFlags(await toDetail(item), item, profile)
}

async function replyToRequest(id, text, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.MANAGE_SUPPORT,
        "You don't have permission to reply to support requests"
    )

    const message = assertReplyText(text)
    const existing = await getSupportRequestById(id)

    if (!existing) {
        throw new NotFoundError({ message: 'Support request not found' })
    }

    assertCanReply(existing, profile)

    const updated = await appendReply(existing, {
        text: message,
        author_type: 'staff',
        adminId: profile._id || profile.id
    })

    notifyAnonymousByEmail(existing, {
        title: 'Новый ответ по вашему запросу',
        intro: 'Команда Scribo ответила на ваше обращение. Посмотреть ответ можно на странице запроса.',
        message
    })

    await notifyTicketOwner(existing, {
        type: 'support_reply',
        user: profile._id || profile.id,
        support_request: existing.access_key
    })

    logSupport(
        'reply_support_request',
        `User replied to support request ${existing._id}`,
        supportLogPayload(updated, {
            user: actorUserId(profile),
            author_type: 'staff'
        })
    )

    return withAccessFlags(await toDetail(updated), updated, profile)
}

async function replyToPublicRequest(access_key, text, profile) {
    const message = assertReplyText(text)
    const existing = await getSupportRequestByAccessKey(access_key)

    if (!existing) {
        throw new NotFoundError({ message: 'Support request not found' })
    }

    const authorType = assertCanReply(existing, profile)
    const asStaff = authorType === 'staff'
    const updated = await appendReply(existing, {
        text: message,
        author_type: asStaff ? 'staff' : 'requester',
        adminId: asStaff ? (profile._id || profile.id) : null
    })

    if (asStaff) {
        notifyAnonymousByEmail(existing, {
            title: 'Новый ответ по вашему запросу',
            intro: 'Команда Scribo ответила на ваше обращение. Посмотреть ответ можно на странице запроса.',
            message
        })

        await notifyTicketOwner(existing, {
            type: 'support_reply',
            user: profile._id || profile.id,
            support_request: existing.access_key
        })
    }

    logSupport(
        'reply_support_request',
        asStaff
            ? `User replied to support request ${existing._id}`
            : `Requester replied to support request ${existing._id}`,
        supportLogPayload(updated, {
            user: actorUserId(profile),
            author_type: asStaff ? 'staff' : 'requester'
        })
    )

    return withAccessFlags(await toDetail(updated), updated, profile)
}

async function updateRequestStatus(id, status, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.MANAGE_SUPPORT,
        "You don't have permission to update support request status"
    )

    const nextStatus = normalizeStatus(status)

    if (!STATUS_LABELS[nextStatus]) {
        throw new BadRequestError({
            errors: {
                body: {
                    status: {
                        message: 'Incorrect status!',
                        data: status
                    }
                }
            }
        })
    }

    const existing = await getSupportRequestById(id)

    if (!existing) {
        throw new NotFoundError({ message: 'Support request not found' })
    }

    if (normalizeStatus(existing.status) === nextStatus) {
        return withAccessFlags(await toDetail(existing), existing, profile)
    }

    const updated = await updateSupportRequestStatus(id, nextStatus)
    const statusLabel = STATUS_LABELS[nextStatus]

    notifyAnonymousByEmail(existing, {
        title: 'Статус вашего запроса изменён',
        intro: `Статус обращения обновлён: ${statusLabel}. Открыть обращение можно на странице запроса.`
    })

    await notifyTicketOwner(existing, {
        type: 'support_status',
        user: profile._id || profile.id,
        support_request: existing.access_key,
        support_status: nextStatus
    })

    logSupport(
        'update_support_status',
        `User updated support request ${existing._id} status to ${nextStatus}`,
        supportLogPayload(updated, {
            user: actorUserId(profile),
            status: nextStatus,
            previous_status: normalizeStatus(existing.status)
        })
    )

    return withAccessFlags(await toDetail(updated), updated, profile)
}

module.exports = {
    createRequest,
    listRequests,
    listMyRequests,
    getRequest,
    getPublicRequest,
    replyToRequest,
    replyToPublicRequest,
    updateRequestStatus,
    KIND_LABELS,
    STATUS_LABELS
}
