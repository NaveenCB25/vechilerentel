import { Router } from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../controllers/authController.ts";
import { requireAuth } from "../middleware/authMiddleware.ts";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);

router.get("/me", requireAuth("user"), getCurrentUser);
router.put("/me", requireAuth("user"), updateProfile);
router.post("/change-password", requireAuth("user"), changePassword);

export default router;
