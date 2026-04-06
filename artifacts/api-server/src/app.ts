import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

// req.path inside app.use("/api", ...) is stripped of the "/api" prefix
const PUBLIC_PATHS = ["/health", "/auth/me"];

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for public paths
  const isPublic = PUBLIC_PATHS.some(
    (p) => req.path === p || req.path.startsWith(p + "/"),
  );
  if (isPublic) return next();

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

// requireAuth skips PUBLIC_PATHS; all other /api routes need a valid Clerk session
app.use("/api", requireAuth, router);

export default app;
