import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Complaint } from "../models/complaint.model.js";
import { Resolution } from "../models/resolution.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import mailSender from "../utils/mailSender.js";
import { sendNotification } from "../utils/sendNotification.js";

const getDashboardOverview = catchAsync(async (req, res) => {
    const pendingQueries = await Complaint.countDocuments({ status: 'Pending', sector: req.user.sectorType });
    const resolvedQueries = await Complaint.countDocuments({ status: 'Resolved', sector: req.user.sectorType });
    const inProgressQueries = await Complaint.countDocuments({ status: 'In Progress', sector: req.user.sectorType });
    const rejectedQueries = await Complaint.countDocuments({ status: 'Rejected', sector: req.user.sectorType });

    // ✅ Return summary
    return res.status(200).json(
        new ApiResponse(200, {
            pendingQueries,
            resolvedQueries,
            inProgressQueries,
            rejectedQueries
        }, "Dashboard overview fetched successfully.")
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
        .sort({ createdAt: -1 })
        .populate("location", "name")
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

const getComplaintDetails = catchAsync(async (req, res) => {

    const complaint = await Complaint.findById(req.params.id)
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("location", "name")
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

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint details fetched successfully")
    );
});

const createTechnician = catchAsync(async (req, res) => {
    const { userName, email, phoneNo, technicianType, password } = req.body;

    const user = await User.create({
        userName,
        email,
        password,
        phoneNo,
        role: "technician",
        technicianType,
        createdBy: req.user._id,
    });

    const createdUser = await User.findById(user._id).populate('createdBy', 'userName email');

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

const getTechnician = catchAsync(async (req, res) => {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const filters = {};

    // Name/keyword search
    if (req.query.search) {
        filters.$or = [
            { userName: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
            { phoneNo: { $regex: req.query.search, $options: 'i' } },
            { technicianType: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Base match conditions for DeliveryEntry
    const technicianMatch = {
        role: "technician",
        ...filters
    };

    if(req.user.role!='superadmin')technicianMatch.technicianType = req.user.sectorType;

    // Count total documents for pagination
    const totalCount = await User.countDocuments(technicianMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const technicians = await User.find(technicianMatch).sort({ createdAt: -1 }).select("-password -refreshToken -FCMToken -__v");

    const response = technicians.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No technicians found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            technician: response,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Technicians fetched successfully.")
    );
});

const removeTechnician = catchAsync(async (req, res) => {
    const { id } = req.body;

    const isRemovedTechnician = await User.deleteOne({ _id: id, role: "technician" });

    if (!isRemovedTechnician) {
        throw new ApiError(500, "something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Technician removed successfully.")
    );
});

const changeTechnicianState = catchAsync(async (req, res) => {
    const { id } = req.body;

    // Step 1: Fetch current user
    const user = await User.findById(id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Step 2: Toggle the value
    const updatedUser = await User.findByIdAndUpdate(
        id,
        { isActive: !user.isActive }, // Toggle value
        { new: true }
    );

    if (!updatedUser) {
        throw new ApiError(500, "something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, `Technician ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully.`)
    );
});

const getSelectionTechnician = catchAsync(async (req, res) => {
    const { technicianType } = req.params;

    const technicians = await User.find({
        role: "technician",
        technicianType
    });

    if (technicians.length <= 0) {
        throw new ApiError(404, "There are no technicians available for this category");
    }

    return res.status(200).json(
        new ApiResponse(200, technicians, "Technicians fetched successfully.")
    );
});

const assignedTechnician = catchAsync(async (req, res) => {
    const { complaintId, assignedWorker } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const technician = await User.findById(assignedWorker);
    if (!technician || technician.role !== "technician") {
        throw new ApiError(404, "Technician not found");
    }

    complaint.assignedWorker = technician._id;
    complaint.assignStatus = "assigned";
    complaint.assignedBy = req.user._id;
    complaint.status = "In Progress";
    complaint.assignedAt = new Date();

    const updatedComplaint = await complaint.save({ validateBeforeSave: false });

    if (!updatedComplaint) {
        throw new ApiError(500, "Failed to assign technician to complaint");
    }

    const response = await Complaint.findById(updatedComplaint._id)
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("location", "name")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        });

    if (!response) {
        throw new ApiError(500, "Failed to fetch updated complaint details");
    }

    let payload = {
        complaintId: String(response._id),
        title: 'New Complaint Assigned',
        message: 'You have been assigned a new complaint. Please review the details, address the issue, and submit your resolution promptly.',
        action: 'NOTIFY_ASSIGN_COMPLAINT',
    };

    if (technician?.FCMToken) {
        sendNotification(technician.FCMToken, payload.action, payload);
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

    const complaint = await Complaint.findOneAndUpdate(
        { resolution: resolution._id },
        {
            $set: { status: "Rejected" },
        },
        { new: true }  // Return the updated document
    ).
        populate("assignedWorker", "userName email profile role phoneNo")
        .populate("location", "name")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        });

    if (!complaint) {
        throw new ApiError(404, "Complaint not found or could not be updated.");
    }

    let payload = {
        complaintId: String(resolution.complaintId),
        title: 'Resolution Rejected',
        message: 'Your resolution for the complaint has been rejected. Please review the feedback and submit an updated resolution.',
        action: 'RESOLUTION_REJECTED',
    };

    sendNotification(resolution.resolvedBy.FCMToken, payload.action, payload);

    return res.status(200).json(
        new ApiResponse(200, complaint, "Resolution rejected successfully.")
    );
});

const approveResolution = catchAsync(async (req, res) => {
    const { resolutionId } = req.params;

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

    const complaint = await Complaint.findOneAndUpdate(
        { resolution: resolution._id },
        {
            $set: { status: "Resolved" },
        },
        { new: true }  // Return the updated document
    ).
        populate("assignedWorker", "userName email profile role phoneNo")
        .populate("location", "name")
        .populate("assignedBy", "userName email profile role phoneNo")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        });

    if (!complaint) {
        throw new ApiError(404, "Complaint not found or could not be updated.");
    }

    let payload = {
        complaintId: String(resolution.complaintId),
        title: 'Resolution Approved',
        message: 'Your submitted resolution for the complaint has been approved.',
        action: 'RESOLUTION_APPROVED',
    };

    if (resolution?.resolvedBy?.FCMToken) {
        sendNotification(resolution?.resolvedBy?.FCMToken, payload.action, payload);
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, "Resolution approved successfully.")
    );
});

const reopenComplaint = catchAsync(async (req, res) => {
    const { complaintId } = req.params;

    const updateResolution = await Resolution.findOneAndUpdate(
        { complaintId },
        {
            status: "under_review",
        },
        { new: true }
    );

    if (!updateResolution) {
        throw new ApiError(404, "No in-progress resolution found for this complaint.");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        complaintId,
        {
            status: "In Progress",
        },
        { new: true }
    )
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("location", "name")
        .populate("assignedBy", "userName email profile role phoneNo FCMToken")
        .populate({
            path: 'resolution',
            populate: [
                { path: 'resolvedBy', select: 'userName email profile role phoneNo FCMToken' },
                { path: 'approvedBy', select: 'userName email profile role phoneNo' },
                { path: 'rejectedBy', select: 'userName email profile role phoneNo' }
            ]
        })
        .select("-__v");

    if (!updatedComplaint) {
        throw new ApiError(404, "Complaint not found or could not be updated.");
    }

    let payload = {
        complaintId: String(updatedComplaint._id),
        title: 'Complaint Reopened',
        message: 'A previously resolved complaint has been reopened and requires further action.',
        action: 'REOPEN_COMPLAINT',
    };

    if (updatedComplaint?.resolution?.resolvedBy?.FCMToken) {
        sendNotification(updatedComplaint?.resolution?.resolvedBy?.FCMToken, payload.action, payload);
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComplaint, "Complaint reopened successfully.")
    );
});

export {
    getDashboardOverview,
    getComplaints,
    getComplaintDetails,
    createTechnician,
    getTechnician,
    removeTechnician,
    changeTechnicianState,
    getSelectionTechnician,
    assignedTechnician,
    rejectResolution,
    approveResolution,
    reopenComplaint
}