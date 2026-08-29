import { Router, type IRouter } from "express";
import healthRouter from "./health";
import astroRouter from "./astro";

const router: IRouter = Router();

router.use(healthRouter);
router.use(astroRouter);

export default router;
