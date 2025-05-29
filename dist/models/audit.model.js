import mongoose, { Schema } from 'mongoose';
const AuditDetailSchema = new Schema({
    score: { type: Number, required: true },
    description: { type: String, required: true },
    displayValue: { type: String },
}, { _id: false });
const AuditsSchema = new Schema({
    'is-on-https': AuditDetailSchema,
    'redirects-http': AuditDetailSchema,
    viewport: AuditDetailSchema,
    'first-contentful-paint': AuditDetailSchema,
    'first-meaningful-paint': AuditDetailSchema,
    speedIndex: AuditDetailSchema,
    'errors-in-console': AuditDetailSchema,
    interactive: AuditDetailSchema,
    'bootup-time': AuditDetailSchema,
}, { _id: false });
const CategoriesSchema = new Schema({
    performance: { type: Number, required: true },
    accessibility: { type: Number, required: true },
    bestPractices: { type: Number, required: true },
    seo: { type: Number, required: true },
}, { _id: false });
const auditSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Seo',
        required: true,
    },
    duration: {
        type: String,
        // required: true
    },
    type: {
        type: String,
        default: 'manual',
        enum: ['manual', 'scheduled'],
        // required: true
    },
    status: {
        type: String,
        default: 'completed',
        enum: ['running', 'completed'],
        // required: true
    },
    criticalCount: {
        type: Number,
        // required: true
    },
    score: {
        type: Number,
        // required: true
    },
    categories: {
        type: CategoriesSchema,
        required: true,
    },
    audits: {
        type: AuditsSchema,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        },
    },
});
// Create and export the model
export const AuditModel = mongoose.model('Audit', auditSchema);
