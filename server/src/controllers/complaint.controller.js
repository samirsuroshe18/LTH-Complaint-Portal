import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Complaint } from '../models/complaint.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { sendNotification } from '../utils/sendNotification.js'
import { getSectorByCategory } from '../utils/getSectorByCategory.js';
import { User } from '../models/user.model.js';

const submitComplaint = catchAsync(async (req, res) => {
    const { category, description, location } = req.body;
    const complaintId = `C${Date.now()}`;
    let imageUrl = null;
    const imagePath = req.file?.path || null;

    if (!category || !location || !description) {
        throw new ApiError(400, "Category, location, and description are required fields.");
    }

    // Block repeat complaints from the same location within 48 hours
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const recentComplaint = await Complaint.findOne({
        location,
        createdAt: { $gte: fortyEightHoursAgo }
    });

    if (recentComplaint) {
        throw new ApiError(429, "A complaint has already been submitted from this location within the last 48 hours. Please wait before submitting again.");
    }

    if (imagePath) {
        const uploadResult = await uploadOnCloudinary(imagePath);
        imageUrl = uploadResult.secure_url;
    }

    const complaint = await Complaint.create({
        complaintId,
        category,
        description,
        location,
        sector: getSectorByCategory(category),
        image: imageUrl || '',
    });

    const fcmTokens = await User.find({ role: 'sectorAdmin', sector: complaint.sector })
        .select('FCMToken')
        .lean();

    const tokens = fcmTokens?.map(user => user.FCMToken).filter(token => token);

    if (tokens.length > 0) {
        const title = `New Complaint: ${complaint.category}`;
        const message = `A new complaint has been registered in ${complaint.location}. Please review and take action.`;

        const payload = {
            title,
            message,            
            complaintId: complaint._id,
            category: complaint.category,
            societyName: complaint.societyName,
            action: "NOTIFY_NEW_COMPLAINT"
        };

        tokens.forEach(token => {
            sendNotification(token, payload.action, JSON.stringify(payload));
        });
    }

    return res.status(201).json(
        new ApiResponse(201, complaint, "Complaint submitted successfully")
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
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await Complaint.countDocuments(complaintMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const updatedComplaint = await Complaint.find(complaintMatch)
        .sort({ createdAt: -1 });

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