import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import{upload} from '../middlewares/multer.middleware.js';

const router = Router();

router.route("/register").post(         //here url will be http://localhost:8000/api/v1/users/register/
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        },
    ]),
    registerUser
); 

export default router;