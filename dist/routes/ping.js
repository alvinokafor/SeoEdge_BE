import { Router } from "express";
const router = Router();
// Health check route
router.get("/", (req, res) => {
    res.status(200).json({ message: "Pong" });
});
export default router;
