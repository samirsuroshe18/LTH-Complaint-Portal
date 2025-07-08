import mongoose, {Schema} from 'mongoose';

const complaintSchema = new Schema({
    complaintId: {
        type: String,
        unique: true,
        required: true,
    },

    category: {
        type: String,
        required: true,
        enum: ['Air Conditioning', 'Electrical', 'Telephone', 'IT Support', 'Housekeeping', 'Carpentry', 'Unsafe Condition', 'Others'],
        default: 'General'
    },

    description: {
        type: String,
        trim: true
    },

    image: {
        type: String
    },

    location: {
        type: String,
        required: true
    },

    assignedWorker: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }, 

    sector: {
        type: String,
        required: true
    },

    adminRemark: {
        type: String,
        trim: true
    },

    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending'
    },

    statusUpdatedAt: {
        type: Date
    },

    assignedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    assignedAt: {
        type: Date,
        default: Date.now
    },

    assignStatus: {
        type: String,
        enum: ["assigned", "unassigned"],
        default: "unassigned"
    },

    resolution : {
        type: Schema.Types.ObjectId,
        ref: "Resolution"
    }

}, { timestamps: true });

export const Complaint = mongoose.model('Complaint', complaintSchema);