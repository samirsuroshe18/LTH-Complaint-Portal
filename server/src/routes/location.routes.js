import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addNewLocation, allLocationPdf, deleteLocation, getLocationById, getLocations, singleLocationPdf, updateLocation } from "../controllers/location.controller.js";

const router = Router();

router.route('/add-new-location').post(verifyJwt, addNewLocation);
router.route('/get-locations').get(getLocations);
router.route('/get-location/:locationId').get(getLocationById);
router.route('/update-location/:id').put(verifyJwt, updateLocation);
router.route('/delete-location/:id').delete(verifyJwt, deleteLocation);
router.route('/single-location-pdf/:id').get(verifyJwt, singleLocationPdf);
router.route('/all-location-pdf').get(verifyJwt, allLocationPdf);

export default router;