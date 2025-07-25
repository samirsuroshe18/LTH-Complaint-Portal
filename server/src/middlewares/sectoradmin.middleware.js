import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";

const verifySectorAdmin = catchAsync(async (req, _, next) => {
    if (req.user.role !== 'sectoradmin') {
        throw new ApiError(403, "You are not sector admin.");
    }

    if (req.user.isActive === false) {
        throw new ApiError(403, "Your account has been deactivated.");
    }

    req.sectoradmin = req.user;
    next();
});

export { verifySectorAdmin };