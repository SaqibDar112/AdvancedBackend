import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);  //here url will be http://localhost:8000/api/v1/users/register/


export default router;