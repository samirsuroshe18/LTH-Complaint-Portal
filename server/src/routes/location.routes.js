import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addLocationsFromExcel, addNewLocation, allLocationPdf, deleteLocation, getLocationById, getLocations, singleLocationPdf, updateLocation } from "../controllers/location.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/add-new-location').post(verifyJwt, addNewLocation);
router.route('/add-excel-location').post(verifyJwt, upload.single("file"), addLocationsFromExcel);
router.route('/get-locations').get(getLocations);
router.route('/get-location/:locationId').get(getLocationById);
router.route('/update-location/:id').put(verifyJwt, updateLocation);
router.route('/delete-location/:id').delete(verifyJwt, deleteLocation);
router.route('/single-location-pdf/:id').get(verifyJwt, singleLocationPdf);
router.route('/all-location-pdf').get(verifyJwt, allLocationPdf);

export default router;