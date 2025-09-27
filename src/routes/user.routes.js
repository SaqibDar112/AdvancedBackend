import { Router } from "express";

import { 
    changeCurrentPassword,
    getCurrentUser, getUserChannelProfile, 
    getWatchHistory, loginUser,
    logoutUser, refreshAccessToken,
    registerUser, updateAccountDetails,
    updateAvatar,updateCoverImg
} from "../controllers/user.controller.js";

import{upload} from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

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
router.route("/login").post(loginUser);

//secured routes    
router.route("/logout").post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/change-password').post(verifyJWT,changeCurrentPassword);
router.route('/current-user').get(verifyJWT,getCurrentUser);
router.route('/update-details').patch(verifyJWT,updateAccountDetails);
router.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateAvatar);
router.route('/cover-Image').patch(verifyJWT,upload.single("coverImage"),updateCoverImg);
router.route("/c/:username").get(verifyJWT,getUserChannelProfile);
router.route("/history").get(verifyJWT,getWatchHistory);

export default router;