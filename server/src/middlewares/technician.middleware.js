import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";

const verifyTechnician = catchAsync(async (req, _, next) => {
    try {
        if (req.user.role !== 'technician') {
            throw new ApiError(401, "You are not a technician.");
        }

        req.technician = req.user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Access denied");
    }
});

export { verifyTechnician };