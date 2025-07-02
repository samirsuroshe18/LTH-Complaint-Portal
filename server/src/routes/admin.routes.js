import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { createSectorAdmin, getAllSectorAdmin, getComplaints, removeSectorAdmin } from "../controllers/admin.controller.js";

const router = Router();

router.route('/get-complaints').get(verifyJwt, verifyAdmin, getComplaints);
router.route('/create-sectoradmin').post(verifyJwt, verifyAdmin, createSectorAdmin);
router.route('/get-sectoradmins').get(verifyJwt, verifyAdmin, getAllSectorAdmin);
router.route('/remove-technician').post(verifyJwt, verifyAdmin, removeSectorAdmin);

export default router;