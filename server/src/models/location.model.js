import mongoose, { Schema } from "mongoose";
import seq from 'mongoose-sequence';

const AutoIncrement = seq(mongoose);

const locationSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true,
        trim: true,
    },

    locationId: {
        type: Number,
        unique: true,
    },

    sectors: {
        type: [String],
        enum: ['Housekeeping', 'Carpentry', 'Telephone', 'Electrical', 'Technical', 'Unsafe Condition', 'Air Conditioning', 'Others'], // allowed values
        default: [],
    },

    qrCode: {
        type: String,
    },

    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    deletedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

locationSchema.plugin(AutoIncrement, { inc_field: 'locationId' });

export const Location = mongoose.model('Location', locationSchema);