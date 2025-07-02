import catchAsync from "../utils/catchAsync.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { Complaint } from "../models/complaint.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Resolution } from "../models/resolution.model.js";
import mongoose from "mongoose";
import { ProfileVerification } from "../models/profileVerification.model.js";
import { sendNotification } from "../utils/sendResidentNotification.js";

const getAssignedComplaints = catchAsync(async (req, res) => {
    const assignedComplaints = await Complaint.find({
        technicianId: req.user._id,
        assignStatus: "assigned",
    })
        .sort({ createdAt: -1 })
        .populate("raisedBy", "userName email profile role phoneNo")
        .populate("technicianId", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        })
        .select("-__v -responses -adminRemark -statusUpdatedAt");

    if (!assignedComplaints || assignedComplaints.length === 0) {
        throw new ApiError(404, "No assigned complaints found.");
    }

    return res.status(200).json(
        new ApiResponse(200, assignedComplaints, "Assigned complaints fetched successfully.")
    );
});

const getTechnicianDetails = catchAsync(async (req, res) => {
    const { complaintId } = req.body;
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(complaintId);

    const complaintDetails = await Complaint.findById(complaintObjectId)
        .sort({ createdAt: -1 })
        .populate("raisedBy", "userName email profile role phoneNo")
        .populate("technicianId", "userName email profile role phoneNo")
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
    let resolutionAttachment = null;

    if (req.file) {
        const resolutionImg = await uploadOnCloudinary(req.file.path);
        resolutionAttachment = resolutionImg?.secure_url;
    }

    const resolution = await Resolution.create({
        complaintId: complaintObjectId,
        resolutionAttachment: resolutionAttachment || '',
        resolutionNote,
        resolvedBy: req.user._id,
        resolutionSubmittedAt: new Date(),
        status: "under_review"
    });

    if (!resolution) {
        throw new ApiError(500, "Failed to create resolution.");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintObjectId,
        {
            resolution: resolution._id,
        },
        { new: true }
    )
    .populate("technicianId", "userName email profile role phoneNo")
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

    if (!updatedComplaint) {
        throw new ApiError(404, "Complaint not found or could not be updated.");
    }

    const results = await ProfileVerification.aggregate([
    { $match: { societyName: req.member.societyName } },
    {
        $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
        }
    },
    { $unwind: "$user" },
    { $match: { "user.role": "admin" } }
    ]);

    let payload = {
        id: updatedComplaint._id,
        title: 'Resolution Submitted for Review',
        message: 'A technician has submitted a resolution for a complaint. Please review and approve or reject the resolution.',
        action: 'REVIEW_RESOLUTION',
    };

    results.forEach(profile => {
        sendNotification(profile.user.FCMToken, payload.action, JSON.stringify(payload));
    });

    return res.status(200).json(
        new ApiResponse(200, updatedComplaint, "Complaint resolution added successfully.")
    );
});

export {
    getAssignedComplaints,
    getTechnicianDetails,
    addComplaintResolution,
}