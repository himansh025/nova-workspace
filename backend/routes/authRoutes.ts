import { Router } from "express";
import { authController } from "../controllers/authController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/register", authController.signup);
router.get("/me", authController.me);
router.patch("/profile", authGuard, authController.updateProfile);
router.put("/profile", authGuard, authController.updateProfile);
router.post("/logout", authController.logout);
router.post("/verify-email", authController.verifyEmail);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;
