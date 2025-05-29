import { Router } from "express";
import ping from "./ping.js";
import AuthRouter from "../modules/auth/auth.routes.js";
import SeoRouter from "../modules/seo/seo.routes.js";
const router = Router();
router.use('/ping', ping);
//Auth routes
router.use('/auth', AuthRouter);
router.use('/seo', SeoRouter);
export default router;
