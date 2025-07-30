import catchAsync from "../utils/catchAsync.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { Complaint } from "../models/complaint.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Resolution } from "../models/resolution.model.js";
import { sendNotification } from "../utils/sendNotification.js";

const getAssignedComplaints = catchAsync(async (req, res) => {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const matchStage = {
        assignedWorker: req.user._id,
        assignStatus: "assigned"
    };

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        matchStage.createdAt = {
            $gte: startDate,
            $lte: endDate
        };
    }

    // Name/keyword search
    if (req.query.search) {
        matchStage.$or = [
            { complaintId: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } },
            { location: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Build aggregation pipeline
    const pipeline = [
        // Match complaints assigned to current user
        { $match: matchStage },

        // Lookup location data
        {
            $lookup: {
                from: "locations",
                localField: "location",
                foreignField: "_id",
                as: "location"
            }
        },
        {
            $addFields: {
                location: { $arrayElemAt: ["$location", 0] }
            }
        },

        // Lookup resolution data
        {
            $lookup: {
                from: "resolutions",
                localField: "resolution",
                foreignField: "_id",
                as: "resolution"
            }
        },

        // Unwind resolution (convert array to object)
        {
            $unwind: {
                path: "$resolution",
                preserveNullAndEmptyArrays: true // Keep complaints without resolutions
            }
        },

        // Filter by resolution status if provided
        ...(req.query.status ? [{
            $match: {
                "resolution.status": req.query.status
            }
        }] : []),

        // Populate assignedWorker
        {
            $lookup: {
                from: "users",
                localField: "assignedWorker",
                foreignField: "_id",
                as: "assignedWorker",
                pipeline: [
                    { $project: { userName: 1, email: 1, profile: 1, role: 1, phoneNo: 1 } }
                ]
            }
        },

        // Populate assignedBy
        {
            $lookup: {
                from: "users",
                localField: "assignedBy",
                foreignField: "_id",
                as: "assignedBy",
                pipeline: [
                    { $project: { userName: 1, email: 1, profile: 1, role: 1, phoneNo: 1 } }
                ]
            }
        },

        // Populate resolution.resolvedBy
        {
            $lookup: {
                from: "users",
                localField: "resolution.resolvedBy",
                foreignField: "_id",
                as: "resolution.resolvedBy",
                pipeline: [
                    { $project: { userName: 1, email: 1, profile: 1, role: 1, phoneNo: 1 } }
                ]
            }
        },

        // Populate resolution.approvedBy
        {
            $lookup: {
                from: "users",
                localField: "resolution.approvedBy",
                foreignField: "_id",
                as: "resolution.approvedBy",
                pipeline: [
                    { $project: { userName: 1, email: 1, profile: 1, role: 1, phoneNo: 1 } }
                ]
            }
        },

        // Populate resolution.rejectedBy
        {
            $lookup: {
                from: "users",
                localField: "resolution.rejectedBy",
                foreignField: "_id",
                as: "resolution.rejectedBy",
                pipeline: [
                    { $project: { userName: 1, email: 1, profile: 1, role: 1, phoneNo: 1 } }
                ]
            }
        },

        // Convert populated arrays to objects (since they're single documents)
        {
            $addFields: {
                assignedWorker: { $arrayElemAt: ["$assignedWorker", 0] },
                assignedBy: { $arrayElemAt: ["$assignedBy", 0] },
                "resolution.resolvedBy": { $arrayElemAt: ["$resolution.resolvedBy", 0] },
                "resolution.approvedBy": { $arrayElemAt: ["$resolution.approvedBy", 0] },
                "resolution.rejectedBy": { $arrayElemAt: ["$resolution.rejectedBy", 0] }
            }
        },

        // Remove __v field
        {
            $project: {
                __v: 0
            }
        },

        // Sort by creation date (newest first)
        { $sort: { createdAt: -1 } }
    ];

    // Count total documents for pagination
    const countPipeline = [
        ...pipeline.slice(0, -1), // Remove sort stage for counting
        { $count: "totalCount" }
    ];

    const countResult = await Complaint.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Add pagination to the main pipeline
    const paginatedPipeline = [
        ...pipeline,
        { $skip: skip },
        { $limit: limit }
    ];

    const assignedComplaints = await Complaint.aggregate(paginatedPipeline);

    if (assignedComplaints.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            assignComplaints: assignedComplaints,
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

    const complaintDetails = await Complaint.findById(complaintId)
        .sort({ createdAt: -1 })
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
    let imageUrl = null;
    const imagePath = req.file?.path || null;

    if (imagePath) {
        const uploadResult = await uploadOnCloudinary(imagePath);
        imageUrl = uploadResult.secure_url;
    }

    const updateResolution = await Resolution.findOneAndUpdate(
        { complaintId },
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
        complaintId,
        {
            status: "In Progress",
        },
        { new: true }
    )
        .populate("assignedWorker", "userName email profile role phoneNo")
        .populate("assignedBy", "userName email profile role phoneNo FCMToken")
        .populate("location", "name")
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

    let payload = {
        complaintId: String(updatedComplaint._id),
        title: 'Resolution Submitted for Review',
        message: 'A technician has submitted a resolution for a complaint. Please review and approve or reject the resolution.',
    };

    if (updatedComplaint?.assignedBy?.FCMToken) {
        const isSuperAdmin = updatedComplaint.assignedBy.role === 'superadmin';
        payload.action = isSuperAdmin ? 'REVIEW_RESOLUTION_ADMIN' : 'REVIEW_RESOLUTION';
        sendNotification(updatedComplaint.assignedBy.FCMToken, payload.action, payload);
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComplaint, "Complaint resolution added successfully.")
    );
});

const startWorkingOnComplaint = catchAsync(async (req, res) => {
    const { id } = req.params;

    const createResolution = await Resolution.create({
        complaintId: id,
        status: "in_progress",
    });

    if (!createResolution) {
        throw new ApiError(500, "Failed to create resolution for the complaint.");
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
        id,
        {
            status: "In Progress",
            resolution: createResolution._id,
        },
        { new: true }
    ).populate("assignedWorker", "userName email profile role phoneNo")
        .populate("location", "name")
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