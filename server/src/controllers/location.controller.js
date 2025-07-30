import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { Location } from '../models/location.model.js';
import QRCode from 'qrcode';
import { generateLocationPDF } from '../utils/generateLocationPDF.js';
import { generateAllLocationsPDF } from '../utils/generateAllLocationPdf.js';

const addNewLocation = catchAsync(async (req, res) => {
    const { name, sectors } = req.body;

    if (!name || sectors.length <= 0) {
        throw new ApiError(400, "name and location ID is required.")
    }

    const isExist = await Location.findOne({ name });

    if (isExist) {
        throw new ApiError(400, "Location name already exists");
    }

    const newLocation = await Location.create({
        name,
        sectors,
        createdBy: req.user._id,
        updatedBy: req.user._id,
    });

    const isCreate = await Location.findById(newLocation._id)
        .populate("createdBy", "userName email")
        .populate("updatedBy", "userName email");

    if (!isCreate) {
        throw new ApiError(500, 'Failed to create location');
    }

    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.QR_CODE_DATA_URL}${isCreate.locationId}`);

    if (!qrCodeDataUrl) {
        throw new ApiError(500, 'Failed to generate QR code');
    }

    isCreate.qrCode = qrCodeDataUrl;
    await isCreate.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, isCreate, "Location created successfully")
    );
});

const getLocations = catchAsync(async (req, res) => {
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

    // Name/keyword search
    if (req.query.search) {
        filters.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { locationId: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Base match conditions for DeliveryEntry
    const locationMatch = {
        isDeleted: false,
        ...filters
    };

    // Count total documents for pagination
    const totalCount = await Location.countDocuments(locationMatch);
    const totalPages = Math.ceil(totalCount / limit);

    const locations = await Location.find(locationMatch)
        .sort({ createdAt: -1 })
        .populate("createdBy", "userName email")
        .populate("updatedBy", "userName email");

    // Apply pagination on combined results
    const response = locations.slice(skip, skip + limit);

    if (response.length <= 0) {
        throw new ApiError(404, "No entries found matching your criteria");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            locations: response,
            pagination: {
                totalEntries: totalCount,
                entriesPerPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasMore: page < totalPages
            }
        }, "Locations fetched successfully.")
    );
});

const updateLocation = catchAsync(async (req, res) => {
    const { id } = req.params;
    let { name, sectors } = req.body;

    if (!name || sectors.length <= 0) {
        throw new ApiError(400, "Name and sectors are required fields.");
    }

    const updateData = {
        name,
        sectors,
    };

    const location = await Location.findOneAndUpdate({ _id: id, isDeleted: false }, updateData, { new: true }).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!location) {
        throw new ApiError(404, "Location not found");
    }

    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.QR_CODE_DATA_URL}${location.locationId}`);

    if (!qrCodeDataUrl) {
        throw new ApiError(500, 'Failed to generate QR code');
    }

    location.qrCode = qrCodeDataUrl;
    await location.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, location, "Location updated successfully")
    );
});

const deleteLocation = catchAsync(async (req, res) => {
    const { id } = req.params;

    const location = await Location.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: req.user._id,
        },
        { new: true }
    ).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!location) {
        throw new ApiError(404, "Location not found");
    }

    return res.status(200).json(
        new ApiResponse(200, location, "Location deleted successfully")
    );
});

const getLocationById = catchAsync(async (req, res) => {
    const { locationId } = req.params;

    if (!locationId) {
        throw new ApiError(400, "Location Id is required");
    }

    const location = await Location.findOne({ locationId, isDeleted: false }).populate("createdBy", "userName email").populate("updatedBy", "userName email");

    if (!location) {
        throw new ApiError(400, "Invalid location ID");
    }

    return res.status(200).json(
        new ApiResponse(200, location, "Location fetched successfully")
    )
});

const singleLocationPdf = catchAsync(async (req, res) => {
    const { id } = req.params;

    const location = await Location.findById(id);
    if (!location) {
        return res.status(404).json({ error: 'Location not found' });
    }

    const pdfBuffer = await generateLocationPDF(location);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="location_${location.name.replace(/[^a-zA-Z0-9]/g, '_')}_qr.pdf"`);
    res.send(pdfBuffer);
});

const allLocationPdf = catchAsync(async (req, res) => {
    const locations = await Location.find().sort({ name: 1 });

    if (locations.length === 0) {
        return res.status(404).json({ error: 'No locations found' });
    }

    const pdfBuffer = await generateAllLocationsPDF(locations);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="all_locations_qr_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
});

export {
    addNewLocation,
    getLocations,
    updateLocation,
    deleteLocation,
    getLocationById,
    singleLocationPdf,
    allLocationPdf
};