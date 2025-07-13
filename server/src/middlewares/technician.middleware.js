import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";

const verifyTechnician = catchAsync(async (req, _, next) => {
    if (req.user.role !== 'technician') {
        throw new ApiError(401, "You are not a technician.");
    }

    if (req.user.isActive === false) {
        throw new ApiError(403, "Your account has been deactivated.");
    }

    req.technician = req.user;
    next();
});

export { verifyTechnician };