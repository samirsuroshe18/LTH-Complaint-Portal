import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifySectorAdmin } from "../middlewares/sectoradmin.middleware.js";
import { assignedTechnician, createTechnician, getComplaintDetails, getComplaints } from "../controllers/sectoradmin.controller.js";

const router = Router();

// Routes
router.route('/get-complaints').get(verifyJwt, verifySectorAdmin, getComplaints);
router.route('/get-complaint-details/:id').get(verifyJwt, verifySectorAdmin, getComplaintDetails);
router.route('/create-technician').post(verifyJwt, verifySectorAdmin, createTechnician);
router.route('/assign-technician').post(verifyJwt, verifySectorAdmin, assignedTechnician);

export default router;