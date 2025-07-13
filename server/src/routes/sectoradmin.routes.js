import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifySectorAdmin } from "../middlewares/sectoradmin.middleware.js";
import { approveResolution, assignedTechnician, changeTechnicianState, createTechnician, getComplaintDetails, getComplaints, getDashboardOverview, getSelectionTechnician, getTechnician, rejectResolution, removeTechnician, reopenComplaint } from "../controllers/sectoradmin.controller.js";

const router = Router();

// Routes
router.route('/get-sector-dashboard-overview').get(verifyJwt, verifySectorAdmin, getDashboardOverview);
router.route('/get-sector-complaints').get(verifyJwt, verifySectorAdmin, getComplaints);
router.route('/get-sector-complaint-details/:id').get(verifyJwt, verifySectorAdmin, getComplaintDetails);
router.route('/create-technician').post(verifyJwt, verifySectorAdmin, createTechnician);
router.route('/get-technician').get(verifyJwt, verifySectorAdmin, getTechnician);
router.route('/remove-technician').post(verifyJwt, verifySectorAdmin, removeTechnician);
router.route('/change-technician-state').post(verifyJwt, verifySectorAdmin, changeTechnicianState);
router.route('/get-selection-technician/:technicianType').get(verifyJwt, verifySectorAdmin, getSelectionTechnician);
router.route('/assign-technician').post(verifyJwt, verifySectorAdmin, assignedTechnician);
router.route('/reject-resolution').post(verifyJwt, verifySectorAdmin, rejectResolution);
router.route('/approve-resolution/:resolutionId').get(verifyJwt, verifySectorAdmin, approveResolution);
router.route('/reopen-complaint/:complaintId').get(verifyJwt, verifySectorAdmin, reopenComplaint);

export default router;