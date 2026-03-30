import { Router } from "express";

import {
  createAdminPenalty,
  createRentalSubmission,
  getAdminRentalOverview,
  getCurrentUserBookings,
  getCurrentUserPenalties,
  updateAdminBookingStatus,
  updateAdminLicenseStatus,
  updateAdminPenaltyStatus,
} from "../controllers/rentalController.ts";
import { requireAuth } from "../middleware/authMiddleware.ts";

const router = Router();

router.post("/", requireAuth("user"), createRentalSubmission);
router.get("/mine", requireAuth("user"), getCurrentUserBookings);
router.get("/mine/penalties", requireAuth("user"), getCurrentUserPenalties);
router.get("/admin/overview", requireAuth("admin"), getAdminRentalOverview);
router.patch("/admin/bookings/:id/status", requireAuth("admin"), updateAdminBookingStatus);
router.patch("/admin/licenses/:id/status", requireAuth("admin"), updateAdminLicenseStatus);
router.post("/admin/penalties", requireAuth("admin"), createAdminPenalty);
router.patch("/admin/penalties/:id/status", requireAuth("admin"), updateAdminPenaltyStatus);

export default router;
