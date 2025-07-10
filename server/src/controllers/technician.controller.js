import catchAsync from "../utils/catchAsync.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { Complaint } from "../models/complaint.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Resolution } from "../models/resolution.model.js";
import mongoose from "mongoose";
import { sendNotification } from "../utils/sendNotification.js";
import { User } from "../models/user.model.js";

const getAssignedComplaints = catchAsync(async (req, res) => {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const filters = {};

    // Status filter
    if (req.query.status) {
        filters.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day

        filters.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }

    // Name/keyword search
    if (req.query.search) {
        filters.$or = [
            { complaintId: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Base match conditions for DeliveryEntry
    const complaintMatch = {
        assignedWorker: req.user._id,
        assignStatus: "assigned",
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await Complaint.countDocuments(complaintMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const assignedComplaints = await Complaint.find(complaintMatch)
        .sort({ createdAt: -1 })
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        })
        .select("-__v");

    // Apply pagination on combined results
    const response = assignedComplaints.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            assignComplaints: response,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Assigned complaints fetched successfully.")
    );
});

const getTechnicianDetails = catchAsync(async (req, res) => {
    const { complaintId } = req.body;
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(complaintId);

    const complaintDetails = await Complaint.findById(complaintObjectId)
        .sort({ createdAt: -1 })
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        })
        .select("-__v -responses");

    if (!complaintDetails || complaintDetails.length === 0) {
        throw new ApiError(404, "No assigned complaints found.");
    }

    return res.status(200).json(
        new ApiResponse(200, complaintDetails, "Assigned complaint details fetched successfully.")
    );
});

const addComplaintResolution = catchAsync(async (req, res) => {
    const { complaintId, resolutionNote } = req.body;
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(complaintId);
    let imageUrl = null;
    const imagePath = req.file?.path || null;

    if (imagePath) {
        const uploadResult = await uploadOnCloudinary(imagePath);
        imageUrl = uploadResult.secure_url;
    }

    const updateResolution = await Resolution.findOneAndUpdate(
        { complaintId: complaintObjectId },
        {
            status: "under_review",
            resolutionAttachment: imageUrl || '',
            resolutionNote,
            resolvedBy: req.user._id,
            resolutionSubmittedAt: new Date(),
        },
        { new: true }
    );

    if (!updateResolution) {
        throw new ApiError(404, "No in-progress resolution found for this complaint.");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintObjectId,
        {
            status: "In Progress",
        },
        { new: true }
    )
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo FCMToken")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        })
        .select("-__v");

    if (!updatedComplaint) {
        throw new ApiError(404, "Complaint not found or could not be updated.");
    }

    const adminFcmToken = await User.findOne({ role: 'superadmin' });
    const fcmTokens = [updatedComplaint?.assignedBy?.FCMToken, adminFcmToken?.FCMToken].filter(Boolean);

    let payload = {
        complaintId: String(updatedComplaint._id),
        title: 'Resolution Submitted for Review',
        message: 'A technician has submitted a resolution for a complaint. Please review and approve or reject the resolution.',
        action: 'REVIEW_RESOLUTION',
    };

    fcmTokens.forEach(token => {
        sendNotification(token, payload.action, payload);
    });

    return res.status(200).json(
        new ApiResponse(200, updatedComplaint, "Complaint resolution added successfully.")
    );
});

const startWorkingOnComplaint = catchAsync(async (req, res) => {
    const { id } = req.params;
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(id);

    const createResolution = await Resolution.create({
        complaintId: complaintObjectId,
        status: "in_progress",
        complaintId: complaintObjectId,
    });

    if (!createResolution) {
        throw new ApiError(500, "Failed to create resolution for the complaint.");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintObjectId,
        {
            status: "In Progress",
            resolution: createResolution._id,
        },
        { new: true }
    ).populate("assignedWorker", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        }).select("-__v");

    if (!updatedComplaint) {
        throw new ApiError(404, "Complaint not found or could not be updated.");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComplaint, "Complaint status updated to 'in progress'.")
    );
});

export {
    getAssignedComplaints,
    getTechnicianDetails,
    addComplaintResolution,
    startWorkingOnComplaint,
}