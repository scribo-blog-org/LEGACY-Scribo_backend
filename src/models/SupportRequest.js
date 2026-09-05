const { Schema, model, Types } = require('mongoose');

const KINDS = ['complaint', 'request', 'help'];
const STATUSES = ['new', 'in_review', 'reviewed'];
const LEGACY_STATUSES = ['open', 'answered'];

const schema = new Schema({
    email: { type: String, required: true, lowercase: true, trim: true },
    kind: { type: String, required: true, enum: KINDS },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: [...STATUSES, ...LEGACY_STATUSES], default: 'new' },
    access_key: { type: String, required: false, unique: true, sparse: true },
    anonymous: { type: Boolean, required: true, default: true },
    user: { type: Types.ObjectId, ref: 'User', required: false, default: null },
    created_date: { type: Date, required: true, default: Date.now },
    updated_date: { type: Date, required: true, default: Date.now },
    replies: [{
        text: { type: String, required: true },
        author_type: { type: String, required: true, enum: ['staff', 'requester'], default: 'staff' },
        admin: { type: Types.ObjectId, ref: 'User', required: false, default: null },
        created_date: { type: Date, required: true, default: Date.now }
    }]
});

schema.index({ status: 1, created_date: -1 });
schema.index({ kind: 1, created_date: -1 });
schema.index({ user: 1, created_date: -1 });

module.exports = model('SupportRequest', schema);
module.exports.KINDS = KINDS;
module.exports.STATUSES = STATUSES;
