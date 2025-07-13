import mongoose from 'mongoose';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { User } from '../models/user.model.js';
import { Complaint } from '../models/complaint.model.js';
import mailSender from '../utils/mailSender.js';
import { Resolution } from '../models/resolution.model.js';
import { sendNotification } from '../utils/sendNotification.js';

const getActiveSectorsGrouped = catchAsync(async (req, res) => {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const filters = {};

    // Name/keyword search
    if (req.query.search) {
        filters.$or = [
            { complaintId: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    const sectorAdmins = await User.find({ role: "sectoradmin", isActive: true });

    // Group admins by sectorType
    const sectorMap = {};

    for (const admin of sectorAdmins) {
        const sector = admin.sectorType;

        if (!sectorMap[sector]) {
            sectorMap[sector] = {
                sectorName: sector,
                admins: [],
                totalCount: 0,
                pendingCount: 0,
                lastUpdated: null,
            };
        }

        sectorMap[sector].admins.push({
            id: admin._id,
            name: admin.userName,
            email: admin.email,
        });

        const complaints = await Complaint.find({ sector });

        const pending = complaints.filter(c => c.status === "Pending").length;
        const total = complaints.length;
        const latest = complaints.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

        sectorMap[sector].pendingCount = pending;
        sectorMap[sector].totalCount = total;
        if (latest?.updatedAt && (!sectorMap[sector].lastUpdated || latest.updatedAt > sectorMap[sector].lastUpdated)) {
            sectorMap[sector].lastUpdated = latest.updatedAt;
        }
    }

    const sectors = Object.values(sectorMap);

    // Apply filters here
    let filteredSectors = sectors;

    if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        filteredSectors = filteredSectors.filter(sectorObj =>
            sectorObj.sectorName.toLowerCase().includes(searchTerm)
        );
    }

    // You can add more filters here similarly

    const totalCount = filteredSectors.length; // Update total count after filtering
    const totalPages = Math.ceil(totalCount / limit);

    const response = filteredSectors.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            ActiveSectorModel: response,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Active sectors grouped by sector admins fetched successfully.")
    );

});

const getDashboardOverview = catchAsync(async (req, res) => {
    // 1. Total active sector admins
    const sectorAdmins = await User.find({ role: 'sectoradmin', isActive: true });
    const totalSectorAdmins = sectorAdmins.length;

    // 2. Total complaints by status
    const pendingQueries = await Complaint.countDocuments({ status: 'Pending' });
    const resolvedQueries = await Complaint.countDocuments({ status: 'Resolved' });
    const inProgressQueries = await Complaint.countDocuments({ status: 'In Progress' });
    const rejectedQueries = await Complaint.countDocuments({ status: 'Rejected' });

    // 3. Active sectors — based on unique sector types assigned to active sector admins
    const activeSectorsSet = new Set(sectorAdmins.map(admin => admin.sectorType));
    const totalActiveSectors = activeSectorsSet.size;

    // ✅ Return summary
    return res.status(200).json(
        new ApiResponse(200, {
            totalSectorAdmins,
            pendingQueries,
            resolvedQueries,
            totalActiveSectors,
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
            { category: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    // Base match conditions for DeliveryEntry
    const complaintMatch = {
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await Complaint.countDocuments(complaintMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const updatedComplaint = await Complaint.find(complaintMatch)
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
    const response = updatedComplaint.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            adminComplaints: response,
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
    const id = mongoose.Types.ObjectId.createFromHexString(req.params.id);

    const complaint = await Complaint.findById(id)
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

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    return res.status(200).json(
        new ApiResponse(200, complaint, "Complaint details fetched successfully")
    );
});

const createSectorAdmin = catchAsync(async (req, res) => {
    const { userName, email, phoneNo, sectorType, password } = req.body;

    const user = await User.create({
        userName,
        email,
        password,
        phoneNo,
        role: "sectoradmin",
        sectorType,
        createdBy: req.user._id
    });

    const createdUser = await User.findById(user._id);

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong");
    }

    const mailResponse = await mailSender(email, "VERIFY_SECTOR_ADMIN", password);

    if (mailResponse) {
        return res.status(200).json(
            new ApiResponse(200, createdUser, "Sector Admin created successfully. An email has been sent to the user with login credentials.")
        );
    }

    throw new ApiError(500, "Something went wrong!! An email couldn't sent to your account");
});

const getAllSectorAdmin = catchAsync(async (req, res) => {
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
            { sectorType: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Base match conditions for DeliveryEntry
    const sectoradminMatch = {
        role: "sectoradmin",
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await Complaint.countDocuments(sectoradminMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const sectoradmins = await User.find(sectoradminMatch).select("-password -refreshToken -FCMToken -__v");

    const response = sectoradmins.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            sectoradmins: response,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Sector Admins fetched successfully.")
    );
});

const removeSectorAdmin = catchAsync(async (req, res) => {
    const { id } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    const isRemovedAdmin = await User.deleteOne({ _id: userId, role: "sectoradmin" });

    if (!isRemovedAdmin) {
        throw new ApiError(500, "something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Sector Admin removed successfully.")
    );
});

const deactivateSectorAdmin = catchAsync(async (req, res) => {
    const { id } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    // Step 1: Fetch current user
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Step 2: Toggle the value
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { isActive: !user.isActive }, // Toggle value
        { new: true }
    );

    if (!updatedUser) {
        throw new ApiError(500, "something went wrong");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, `Sector Admin ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully.`)
    );
});

const getTechnician = catchAsync(async (req, res) => {
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
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(complaintId);
    const workerObjectId = mongoose.Types.ObjectId.createFromHexString(assignedWorker);

    const complaint = await Complaint.findById(complaintObjectId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    const technician = await User.findById(workerObjectId);
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

    const adminFcmToken = await User.findOne({ role: 'superadmin' });
    const fcmTokens = [resolution?.resolvedBy?.FCMToken, adminFcmToken?.FCMToken].filter(Boolean);

    let payload = {
        complaintId: String(resolution.complaintId),
        title: 'Resolution Approved',
        message: 'Your submitted resolution for the complaint has been approved by the society manager.',
        action: 'RESOLUTION_APPROVED',
    };

    fcmTokens.forEach(token => {
        sendNotification(token, payload.action, payload);
    });

    return res.status(200).json(
        new ApiResponse(200, complaint, "Resolution approved successfully.")
    );
});

const reopenComplaint = catchAsync(async (req, res) => {
    const { complaintId } = req.params;
    const complaintObjectId = mongoose.Types.ObjectId.createFromHexString(complaintId);

    const updateResolution = await Resolution.findOneAndUpdate(
        { complaintId: complaintObjectId },
        {
            status: "under_review",
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
        title: 'Complaint Reopened',
        message: 'A previously resolved complaint has been reopened and requires further action.',
        action: 'REOPEN_COMPLAINT',
    };

    fcmTokens.forEach(token => {
        if (!token === req.user.FCMToken) {
            sendNotification(token, payload.action, payload);
        }
    });

    return res.status(200).json(
        new ApiResponse(200, updatedComplaint, "Complaint reopened successfully.")
    );
});

export {
    getComplaints,
    createSectorAdmin,
    getAllSectorAdmin,
    removeSectorAdmin,
    deactivateSectorAdmin,
    getActiveSectorsGrouped,
    getDashboardOverview,
    getComplaintDetails,
    rejectResolution,
    approveResolution,
    getTechnician,
    assignedTechnician,
    reopenComplaint,
};