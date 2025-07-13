import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { approveResolution, assignedTechnician, createSectorAdmin, deactivateSectorAdmin, getActiveSectorsGrouped, getAllSectorAdmin, getComplaintDetails, getComplaints, getDashboardOverview, getTechnician, rejectResolution, removeSectorAdmin, reopenComplaint } from "../controllers/admin.controller.js";

const router = Router();

router.route('/get-complaints').get(verifyJwt, verifyAdmin, getComplaints);
router.route('/create-sectoradmin').post(verifyJwt, verifyAdmin, createSectorAdmin);
router.route('/get-sectoradmins').get(verifyJwt, verifyAdmin, getAllSectorAdmin);
router.route('/remove-sector-admin').post(verifyJwt, verifyAdmin, removeSectorAdmin);
router.route('/deactivate-sector-admin').post(verifyJwt, verifyAdmin, deactivateSectorAdmin);
router.route('/get-active-sectors-grouped').get(verifyJwt, verifyAdmin, getActiveSectorsGrouped);
router.route('/get-dashboard-overview').get(verifyJwt, verifyAdmin, getDashboardOverview);
router.route('/get-admin-complaint-details/:id').get(verifyJwt, verifyAdmin, getComplaintDetails);
router.route('/reject-resolution').post(verifyJwt, verifyAdmin, rejectResolution);
router.route('/approve-resolution/:resolutionId').get(verifyJwt, verifyAdmin, approveResolution);
router.route('/get-technicians/:technicianType').get(verifyJwt, verifyAdmin, getTechnician);
router.route('/assigned-technician').post(verifyJwt, verifyAdmin, assignedTechnician);
router.route('/reopen-complaint/:complaintId').get(verifyJwt, verifyAdmin, reopenComplaint)

export default router;