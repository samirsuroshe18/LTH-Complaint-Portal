import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";

const verifySectorAdmin = catchAsync(async (req, _, next) => {
    try {
        if (req.user.role !== 'sectoradmin') {
            throw new ApiError(401, "You are not sector admin.");
        }

        req.sectoradmin = req.user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Access denied");
    }
});

export { verifySectorAdmin };