const { Schema, model, Types } = require("mongoose")

const schema = new Schema({
    created_at: { type: Date, required: true, default: Date.now, index: true },
    path: { type: String, required: true },
    visitor_id: { type: String, required: true, index: true },
    user: { type: Types.ObjectId, ref: "User", required: false, default: null },
    referrer: { type: String, required: false, default: "" },
    ip: { type: String, required: false, default: "" },
    city: { type: String, required: false, default: "" },
    region: { type: String, required: false, default: "" },
    country: { type: String, required: false, default: "" },
    is_entry: { type: Boolean, required: true, default: false, index: true }
})

schema.index({ visitor_id: 1, path: 1, created_at: -1 })
schema.index({ visitor_id: 1, created_at: -1 })
schema.index({ created_at: 1, path: 1 })
schema.index({ city: 1, created_at: -1 })

module.exports = model("PageView", schema)
