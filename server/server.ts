import app from "@/index";
import { serve } from "@hono/node-server";

const port = parseInt(process.env.PORT as string);

serve({
  port: port,
  fetch: app.fetch,
});
