import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Complaint } from '../models/complaint.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { sendNotification } from '../utils/sendNotification.js';
import { User } from '../models/user.model.js';
import { Location } from '../models/location.model.js';

const submitComplaint = catchAsync(async (req, res) => {
    const { sector, description, locationId } = req.body;

    const complaintId = `QRY-${Math.floor(10000 + Math.random() * 90000)}`;
    let imageUrl = null;
    const imagePath = req.file?.path || null;

    const location = await Location.findOne({ locationId: Number(locationId), sectors: sector, isDeleted: false }).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!location) {
        throw new ApiError(400, "Invalid location ID or Sector", imagePath);
    }

    if (!sector || !location || !description) {
        throw new ApiError(400, "Category, location, and description are required fields.", imagePath);
    }

    // Block repeat complaints from the same location within 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const recentComplaint = await Complaint.findOne({
        location: location._id,
        sector,
        createdAt: { $gte: fortyEightHoursAgo }
    });

    if (recentComplaint) {
        throw new ApiError(429, "A complaint has already been submitted from this location within the last 48 hours. Please wait before submitting again.", imagePath);
    }

    if (imagePath) {
        const uploadResult = await uploadOnCloudinary(imagePath);
        imageUrl = uploadResult.secure_url;
    }

    const complaint = await Complaint.create({
        complaintId,
        sector,
        description,
        location: location._id,
        image: imageUrl || '',
    });

    const isExist = await Complaint.findById(complaint._id)
        .populate('location', 'name');

    if (!isExist) {
        throw new ApiError(400, "Something went wrong");
    }

    const fcmTokens = await User.find({
        $or: [
            { role: 'sectoradmin', sectorType: complaint.sector },
            { role: 'superadmin' }
        ]
    }).select('FCMToken role').lean();

    const usersWithTokens = fcmTokens?.filter(user => user.FCMToken && user.role === "sectoradmin");
    const superadminTokens = fcmTokens?.filter(user => user.FCMToken && user.role === "superadmin");

    const title = `New Complaint: ${complaint.sector}`;
    const message = `A new complaint has been registered in ${complaint.location.name}. Please review and take action.`;

    const basePayload = {
        title,
        message,
        complaintId: String(complaint._id),
        category: complaint.sector,
        ...(complaint?.image && { imageUrl: complaint.image }),
    };

    if (usersWithTokens.length > 0) {
        const payload = {
            ...basePayload,
            action: 'NOTIFY_NEW_COMPLAINT'
        };

        usersWithTokens.forEach(user => {
            sendNotification(user.FCMToken, payload.action, payload);
        });
    } else {
        const payload = {
            ...basePayload,
            action: 'NOTIFY_NEW_COMPLAINT_ADMIN'
        };

        superadminTokens.forEach(user => {
            sendNotification(user.FCMToken, payload.action, payload);
        });
    }

    return res.status(201).json(
        new ApiResponse(201, isExist, "Complaint submitted successfully")
    );
});

const getComplaints = catchAsync(async (req, res) => {
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

    if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);

        filters.createdAt = {
            $gte: startDate
        };
    }

    if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);

        filters.createdAt = {
            $lte: endDate
        };
    }

    // Name/keyword search
    if (req.query.search) {
        filters.$or = [
            { complaintId: { $regex: req.query.search, $options: 'i' } },
            { sector: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
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
        .populate("location", "name")
        .populate("assignedWorker", "userName email");

    // Apply pagination on combined results
    const response = updatedComplaint.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            complaints: response,
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

export {
    submitComplaint,
    getComplaints,
};