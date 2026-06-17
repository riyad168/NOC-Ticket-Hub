import cron from "node-cron";
import prisma from "./prisma.js";

const SLA_MINUTES = 60;

export function startSlaChecker(): void {
  cron.schedule("* * * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - SLA_MINUTES * 60 * 1000);
      await prisma.ticket.updateMany({
        where: {
          status: { in: ["Open", "In_Progress"] },
          slaBreached: false,
          createdAt: { lt: cutoff },
        },
        data: { slaBreached: true },
      });
    } catch {
      // Ignore cron errors
    }
  });
}
