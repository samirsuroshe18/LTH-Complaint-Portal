import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { NoticeBoard } from "../models/noticeBoard.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync.js";
import { User } from "../models/user.model.js";
import { sendMultiNotification } from "../utils/sendNotification.js";

const createNotice = catchAsync(async (req, res) => {
    const { title, description } = req.body;
    let imageUrl = null;
    const imagePath = req.file?.path || null;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required fields.", imagePath);
    }

    if (imagePath) {
        const uploadResult = await uploadOnCloudinary(imagePath);
        imageUrl = uploadResult.secure_url;
    }

    const notice = await NoticeBoard.create({
        title,
        image: imageUrl || '',
        description,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    });

    const existNotice = await NoticeBoard.findById(notice._id).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!existNotice) {
        throw new ApiError(400, "Notice creation failed");
    }

    const payload = {
        title,
        message: description,
        noticeData: JSON.stringify(existNotice),
        action: 'NOTIFY_NOTICE',
        ...(existNotice?.image && { imageUrl: existNotice.image }),
    };

    const users = await User.find({
        isActive: true,
        FCMToken: { $ne: null },
        _id: { $ne: req.user._id }
    });
    
    const tokens = users.map((u) => u.FCMToken).filter(Boolean);

    if (tokens.length > 0) {
        sendMultiNotification(tokens, payload);
    }

    return res.status(201).json(
        new ApiResponse(200, existNotice, "Notice created successfully")
    );
});

const getNotices = catchAsync(async (req, res) => {
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
            { title: { $regex: req.query.search, $options: 'i' } },
            { description: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Base match conditions for DeliveryEntry
    const noticeMatch = {
        isDeleted: false,
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await NoticeBoard.countDocuments(noticeMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const notices = await NoticeBoard.find(noticeMatch)
        .sort({ createdAt: -1 })
        .populate("createdBy", "userName email")
        .populate("updatedBy", "userName email");

    // Apply pagination on combined results
    const response = notices.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            notices: response,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Notices fetched successfully.")
    );
});

const updateNotice = catchAsync(async (req, res) => {
    const { id } = req.params;
    let { title, description, image } = req.body;
    let imageUrl = null;
    const imagePath = req.file?.path || null;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required fields.", imagePath);
    }

    if (imagePath) {
        const uploadResult = await uploadOnCloudinary(imagePath);
        imageUrl = uploadResult.secure_url;
    }

    const updateData = {
        title,
        description,
        image: imageUrl || image || 'N/A',
        updatedBy: req.user._id,
    };

    const notice = await NoticeBoard.findOneAndUpdate({ _id: id, isDeleted: false }, updateData, { new: true }).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!notice) {
        throw new ApiError(404, "Notice not found");
    }

    return res.status(200).json(
        new ApiResponse(200, notice, "Notice updated successfully")
    );
});

const deleteNotice = catchAsync(async (req, res) => {
    const id = mongoose.Types.ObjectId.createFromHexString(req.params.id);

    const notice = await NoticeBoard.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: req.user._id,
        },
        { new: true }
    ).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!notice) {
        throw new ApiError(404, "Notice not found");
    }

    return res.status(200).json(
        new ApiResponse(200, notice, "Notice deleted successfully")
    );
});

export { createNotice, getNotices, updateNotice, deleteNotice };