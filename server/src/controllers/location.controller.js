import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { Location } from '../models/location.model.js';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import fs from 'fs';
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
        const search = req.query.search;
        if (search) {
            const orConditions = [
                { name: { $regex: search, $options: 'i' } }
            ];

            if (!isNaN(search)) {
                orConditions.push({ locationId: Number(search) });
            }

            filters.$or = orConditions;
        }
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

const addLocationsFromExcel = catchAsync(async (req, res) => {
    // Check if file is uploaded
    if (!req.file) {
        throw new ApiError(400, "Excel file is required");
    }

    try {
        // Read Excel file from disk path
        const filePath = req.file.path;
        const workbook = XLSX.default.readFile(filePath);

        // Clean up the uploaded file after reading
        fs.unlinkSync(filePath);

        // Check if workbook and sheets exist
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new ApiError(400, "Invalid Excel file or no sheets found");
        }

        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            throw new ApiError(400, "Worksheet not found in Excel file");
        }

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            throw new ApiError(400, "Excel file is empty or has no valid data");
        }

        // Validate and prepare location data
        const locationsToCreate = [];
        const errors = [];

        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            // Validate required fields
            if (!row.name || !row.sectors) {
                errors.push(`Row ${rowNumber}: Missing required fields (name, sectors)`);
                continue;
            }

            // Parse sectors - handle comma-separated string
            let sectors;
            try {
                if (typeof row.sectors === 'string') {
                    // Split by comma and trim whitespace
                    sectors = row.sectors.split(',').map(s => s.trim()).filter(s => s.length > 0);
                } else if (Array.isArray(row.sectors)) {
                    sectors = row.sectors;
                } else {
                    sectors = [row.sectors.toString()]; // Convert to string and make array
                }

                if (sectors.length === 0) {
                    errors.push(`Row ${rowNumber}: Sectors cannot be empty`);
                    continue;
                }
            } catch (error) {
                errors.push(`Row ${rowNumber}: Invalid sectors format - ${error.message}`);
                continue;
            }

            // Check for duplicate names in current batch
            const duplicateInBatch = locationsToCreate.find(loc => loc.name === row.name);
            if (duplicateInBatch) {
                errors.push(`Row ${rowNumber}: Duplicate location name "${row.name}" in Excel file`);
                continue;
            }

            locationsToCreate.push({
                name: row.name,
                sectors: sectors,
                createdBy: req.user._id,
                updatedBy: req.user._id,
            });
        }

        // If there are validation errors, return them
        if (errors.length > 0) {
            throw new ApiError(400, `Validation errors found:\n${errors.join('\n')}`);
        }

        // Check for existing locations in database
        const existingNames = await Location.find({
            name: { $in: locationsToCreate.map(loc => loc.name) }
        }).select('name');

        if (existingNames.length > 0) {
            const duplicateNames = existingNames.map(loc => loc.name);
            throw new ApiError(400, `Following location names already exist: ${duplicateNames.join(', ')}`);
        }

        // Create locations one by one to allow auto-increment locationId
        // Using Promise.allSettled to handle partial failures gracefully
        const creationPromises = locationsToCreate.map(async (locationData) => {
            try {
                const newLocation = await Location.create(locationData);
                return { success: true, location: newLocation };
            } catch (createError) {
                console.error(`Failed to create location ${locationData.name}:`, createError);
                return {
                    success: false,
                    error: `Failed to create location "${locationData.name}": ${createError.message}`,
                    locationName: locationData.name
                };
            }
        });

        const creationResults = await Promise.allSettled(creationPromises);

        const createdLocations = [];
        const creationErrors = [];

        creationResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    createdLocations.push(result.value.location);
                } else {
                    creationErrors.push(result.value.error);
                }
            } else {
                const locationName = locationsToCreate[index].name;
                creationErrors.push(`Failed to create location "${locationName}": ${result.reason}`);
            }
        });

        if (createdLocations.length === 0) {
            throw new ApiError(500, `Failed to create any locations. Errors: ${creationErrors.join(', ')}`);
        }

        // Generate QR codes for all locations
        const locationsWithQR = await Promise.all(
            createdLocations.map(async (location) => {
                try {
                    const qrCodeDataUrl = await QRCode.toDataURL(`${process.env.QR_CODE_DATA_URL}${location.locationId}`);

                    // Update location with QR code
                    await Location.findByIdAndUpdate(
                        location._id,
                        { qrCode: qrCodeDataUrl },
                        { validateBeforeSave: false }
                    );

                    return {
                        ...location.toObject(),
                        qrCode: qrCodeDataUrl
                    };
                } catch (qrError) {
                    console.error(`Failed to generate QR code for location ${location.name}:`, qrError);
                    return {
                        ...location.toObject(),
                        qrCode: null,
                        qrError: 'Failed to generate QR code'
                    };
                }
            })
        );

        // Get populated data for response
        const populatedLocations = await Location.find({
            _id: { $in: createdLocations.map(loc => loc._id) }
        })
            .populate("createdBy", "userName email")
            .populate("updatedBy", "userName email");

        // Add QR codes to populated data
        const finalLocations = populatedLocations.map(location => {
            const locationWithQR = locationsWithQR.find(l => l._id.toString() === location._id.toString());
            return {
                ...location.toObject(),
                qrCode: locationWithQR?.qrCode || null,
                qrError: locationWithQR?.qrError || null
            };
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    locations: finalLocations,
                    summary: {
                        totalInFile: jsonData.length,
                        successfullyCreated: createdLocations.length,
                        failed: creationErrors.length,
                        errors: creationErrors.length > 0 ? creationErrors : undefined
                    }
                },
                `Successfully processed Excel file. Created ${createdLocations.length} locations${creationErrors.length > 0 ? `, ${creationErrors.length} failed` : ''}`
            )
        );

    } catch (error) {
        // Clean up file if it exists and there was an error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, `Failed to process Excel file: ${error.message}`);
    }
});

export {
    addNewLocation,
    getLocations,
    updateLocation,
    deleteLocation,
    getLocationById,
    singleLocationPdf,
    allLocationPdf,
    addLocationsFromExcel
};