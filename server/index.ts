import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import { type ErrorResponse } from "@/shared/types";

import type { Context } from "./context";
import { lucia } from "./lucia";
import { authRouter } from "./routes/auth";
import { postRouter } from "./routes/posts";

const app = new Hono<Context>();

app.use("*", async (c, next) => {
  const start = performance.now();
  await next();
  const duration = (performance.now() - start).toFixed(1);
  console.log(`${c.req.method} ${c.req.path} - ${duration}ms`);
});

// Skip session validation for auth endpoints (login/signup) to improve performance
app.use("*", cors(), async (c, next) => {
  // Skip session validation for login/signup endpoints
  if (c.req.path === "/api/auth/login" || c.req.path === "/api/auth/signup") {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    // use `header()` instead of `setCookie()` to avoid TS errors
    c.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }
  if (!session) {
    c.header("Set-Cookie", lucia.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }
  c.set("user", user);
  c.set("session", session);
  return next();
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const routes = app
  .basePath("/api")
  .route("/auth", authRouter)
  .route("/posts", postRouter);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    const errResponse =
      err.res ??
      c.json<ErrorResponse>(
        {
          success: false,
          error: err.message,
          isFormerror:
            err.cause && typeof err.cause === "object" && "form" in err.cause
              ? err.cause.form === true
              : false,
        },
        err.status,
      );

    return errResponse;
  }

  return c.json<ErrorResponse>(
    {
      success: false,
      error:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : (err.stack ?? err.message),
    },
    500,
  );
});

export default app;
export type ApiRoutes = typeof routes;
