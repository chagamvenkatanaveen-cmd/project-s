import openNextWorker from "./.open-next/worker.js";
import { checkDueApplicationJobs } from "./lib/jobExpiration.js";

export default {
  fetch(request, env, ctx) {
    return openNextWorker.fetch(request, env, ctx);
  },

  scheduled(controller, env, ctx) {
    ctx.waitUntil(
      checkDueApplicationJobs(env.DB, {
        scheduledAt: controller.scheduledTime,
      }),
    );
  },
};
