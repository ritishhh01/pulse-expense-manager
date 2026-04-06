import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import groupsRouter from "./groups";
import expensesRouter from "./expenses";
import settlementsRouter from "./settlements";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(groupsRouter);
router.use(expensesRouter);
router.use(settlementsRouter);
router.use(dashboardRouter);

export default router;
