import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Complaint } from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { generatePassword } from "../utils/generatePassword.js";
import mailSender from "../utils/mailSender.js";

const createTechnician = catchAsync(async (req, res) => {
    const { userName, email, phoneNo, technicianType } = req.body;
    const password = generatePassword();

    const user = await User.create({
        userName,
        email,
        password,
        phoneNo,
        role: "technician",
        technicianType,
    });

    const createdUser = await User.findById(user._id);

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong");
    }

    const mailResponse = await mailSender(email, "VERIFY_TECHNICIAN", password);

    if (mailResponse) {
        return res.status(200).json(
            new ApiResponse(200, createdUser, "Technician created successfully. An email has been sent to the technician's account with the credentials.")
        );
    }

    throw new ApiError(500, "Something went wrong!! An email couldn't sent to your account");
});

const getComplaintDetails = catchAsync(async (req, res) => {
    const id = mongoose.Types.ObjectId.createFromHexString(req.params.id);
    const complaint = await Complaint.findById(id);

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint details fetched successfully")
    );
});

const getComplaints = catchAsync(async (req, res) => {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const filters = {};

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);

        filters.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }

    // Entry type filter
    if (req.query.status) {
        filters.status = req.query.status;
    }

    // Name/keyword search
    if (req.query.search) {
        filters.$or = [
            { complaintId: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    // Base match conditions for DeliveryEntry
    const complaintMatch = {
        sector: req.user.sectorType,
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await Complaint.countDocuments(complaintMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const updatedComplaint = await Complaint.find(complaintMatch)
        .sort({ createdAt: -1 }) // Sort by newest complaint first
        .populate("responses.responseBy", "userName email profile role phoneNo")
        .populate("raisedBy", "userName email profile role phoneNo");

    // Apply pagination on combined results
    const response = updatedComplaint.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            complaints: response,
            user: req.user,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Complaints fetched successfully.")
    );
});

const assignedTechnician = catchAsync(async (req, res) => {
    const { complaintId, technicianId } = req.body;
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(complaintId);
    const technicianObjectId = mongoose.Types.ObjectId.createFromHexString(technicianId);

    const complaint = await Complaint.findById(complaintObjectId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const technician = await User.findById(technicianObjectId);
    if (!technician || technician.role !== "technician") {
        throw new ApiError(404, "Technician not found");
    }

    complaint.technicianId = technician._id;
    complaint.assignStatus = "assigned";
    complaint.assignedBy = req.user._id;
    complaint.assignedAt = new Date();

    const updatedComplaint = await complaint.save({ validateBeforeSave: false });
    
    if (!updatedComplaint) {
        throw new ApiError(500, "Failed to assign technician to complaint");
    }

    const response = await Complaint.findById(updatedComplaint._id)
        .populate("technicianId", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo");
        // .populate({
        //     path: 'resolution',
        //     populate: [
        //         { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
        //         { path: 'approvedBy', select: 'userName email profile role phoneNo' },
        //         { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
        //     ]
        // });

    if (!response) {
        throw new ApiError(500, "Failed to fetch updated complaint details");
    }

    let payload = {
        id: response._id,
        title: 'New Complaint Assigned',
        message: 'You have been assigned a new complaint. Please review the details, address the issue, and submit your resolution promptly.',
        action: 'ASSIGN_COMPLAINT',
    };

    if( technician?.FCMToken) {
        sendNotification(technician.FCMToken, payload.action, JSON.stringify(payload));
    }

    return res.status(200).json(
        new ApiResponse(200, response, "Technician assigned to complaint successfully")
    );
});

const rejectResolution = catchAsync(async (req, res) => {
    const { resolutionId, rejectedNote } = req.body;

    const resolution = await Resolution.findByIdAndUpdate(
        resolutionId,
        {
            status: "rejected",
            rejectedNote: rejectedNote,
            rejectedBy: req.user._id
        },
        { new: true }
    ).populate("resolvedBy", "userName email profile role phoneNo FCMToken");

    if (!resolution) {
        throw new ApiError(404, "Resolution not found or could not be updated.");
    }

    let payload = {
        id: resolution.complaintId,
        title: 'Resolution Rejected',
        message: 'Your resolution for the complaint has been rejected. Please review the feedback and submit an updated resolution.',
        action: 'RESOLUTION_REJECTED',
    };

    sendNotification(resolution.resolvedBy.FCMToken, payload.action, JSON.stringify(payload));

    return res.status(200).json(
        new ApiResponse(200, resolution, "Resolution rejected successfully.")
    );
});

const approveResolution = catchAsync(async (req, res) => {
    const { resolutionId } = req.body;

    const resolution = await Resolution.findByIdAndUpdate(
        resolutionId,
        {
            status: "approved",
            approvedBy: req.user._id
        },
        { new: true }
    ).populate("resolvedBy", "userName email profile role phoneNo FCMToken");

    if (!resolution) {
        throw new ApiError(404, "Resolution not found or could not be updated.");
    }

    let payload = {
        id: resolution.complaintId,
        title: 'Resolution Approved',
        message: 'Your submitted resolution for the complaint has been approved by the society manager.',
        action: 'RESOLUTION_APPROVED',
    };

    sendNotification(resolution.resolvedBy.FCMToken, payload.action, JSON.stringify(payload));

    return res.status(200).json(
        new ApiResponse(200, resolution, "Resolution approved successfully.")
    );
});

export {
    createTechnician,
    assignedTechnician,
    getComplaintDetails,
    getComplaints
}