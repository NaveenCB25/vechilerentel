import { Router } from "express";

import {
  createRentalSubmission,
  getAdminRentalOverview,
  getCurrentUserBookings,
  updateAdminBookingStatus,
  updateAdminLicenseStatus,
} from "../controllers/rentalController.ts";
import { requireAuth } from "../middleware/authMiddleware.ts";

const router = Router();

router.post("/", requireAuth("user"), createRentalSubmission);
router.get("/mine", requireAuth("user"), getCurrentUserBookings);
router.get("/admin/overview", requireAuth("admin"), getAdminRentalOverview);
router.patch("/admin/bookings/:id/status", requireAuth("admin"), updateAdminBookingStatus);
router.patch("/admin/licenses/:id/status", requireAuth("admin"), updateAdminLicenseStatus);

export default router;
