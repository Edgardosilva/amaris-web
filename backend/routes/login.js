import express from "express";
import LoginController from "../controllers/LoginController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validations/authValidations.js";

const router = express.Router();

router.post("/", validate(loginSchema), LoginController.login);

router.post("/register", validate(registerSchema), LoginController.register);

router.post("/logout", LoginController.logout);

router.get("/verificarToken", LoginController.verificarToken);

router.get('/auth/me', LoginController.getCurrentUser);



export default router;