import { Router } from "express";

import { searchLocations } from "../controllers/locationController.ts";

const router = Router();

router.get("/search", searchLocations);

export default router;
