import mongoose, {Schema} from 'mongoose';

const complaintSchema = new Schema({
    complaintId: {
        type: String,
        unique: true, // Ensure each complaint has a unique ID
        required: true,
    },

    // Type/category of complaint (e.g. IT, electrical, plumbing)
    category: {
        type: String,
        required: true,
        enum: ['AC', 'Light', 'Telephone', 'Technical', 'HouseKeeping', 'Carpentry', 'Danger', 'Other'],
        default: 'General'
    },

    // Optional description by user
    description: {
        type: String,
        trim: true
    },

    // Optional image URL (uploaded to Cloudinary, etc.)
    image: {
        type: String
    },

    // Location of the issue (e.g. "Block A, Room 101")
    location: {
        type: String,
        required: true
    },

    // Sector admin managing this complaint
    assignedSectorAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Worker assigned to handle the complaint
    assignedWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }, 

    // Sector name for reporting/filtering
    sector: {
        type: String,
        required: true
    },

    // Optional remark added by the sector admin
    adminRemark: {
        type: String,
        trim: true
    },

    // Complaint status
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending'
    },

    // Time when status was last updated
    statusUpdatedAt: {
        type: Date
    },

    technicianId: {
        type: Schema.Types.ObjectId,
        ref: "User"
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