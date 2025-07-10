import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifySectorAdmin } from "../middlewares/sectoradmin.middleware.js";
import { approveResolution, assignedTechnician, createTechnician, getComplaintDetails, getComplaints, rejectResolution, getTechnician } from "../controllers/sectoradmin.controller.js";

const router = Router();

// Routes
router.route('/get-complaints').get(verifyJwt, verifySectorAdmin, getComplaints);
router.route('/get-complaint-details/:id').get(verifyJwt, verifySectorAdmin, getComplaintDetails);
router.route('/create-technician').post(verifyJwt, verifySectorAdmin, createTechnician);
router.route('/get-technician').get(verifyJwt, verifySectorAdmin, getTechnician);
router.route('/assign-technician').post(verifyJwt, verifySectorAdmin, assignedTechnician);
router.route('reject-resolution').post(verifyJwt, verifySectorAdmin, rejectResolution);
router.route('approve-resolution').post(verifyJwt, verifySectorAdmin, approveResolution);

export default router;