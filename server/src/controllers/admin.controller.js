import mongoose from 'mongoose';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { User } from '../models/user.model.js';
import { Complaint } from '../models/complaint.model.js';
import { generatePassword } from '../utils/generatePassword.js';
import mailSender from '../utils/mailSender.js';

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
        .sort({ createdAt: -1 });

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

const createSectorAdmin = catchAsync(async (req, res) => {
    const { userName, email, phoneNo, sectorType } = req.body;
    const password = generatePassword();

    const user = await User.create({
        userName,
        email,
        password,
        phoneNo,
        role: "sectoradmin",
        sectorType,
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

    const sectoradmins = await User.find(sectoradminMatch).select("-password -refreshToken -FCMToken -__v");

    if (sectoradmins.length <= 0) {
        throw new ApiError(404, "No technicians found");
    }

    return res.status(200).json(
        new ApiResponse(200, sectoradmins, "Sector Admins fetched successfully.")
    );
});

const removeSectorAdmin = catchAsync(async (req, res) => {
    const { id } = req.body;
    const userId = mongoose.Types.ObjectId.createFromHexString(id);

    const isRemovedAdmin = await User.deleteOne({ _id: userId, userType: "sectoradmin" });

    if (!isRemovedAdmin) {
        throw new ApiError(500, "something went wrong");
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Sector Admin removed successfully.")
    );
});

export {
    getComplaints,
    createSectorAdmin,
    getAllSectorAdmin,
    removeSectorAdmin,
};