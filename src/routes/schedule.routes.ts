import { FastifyInstance } from "fastify";
import { getSchedule, getWeeklySchedule, getMonthlySchedule, getAllSubgroups, getCombinedSchedule } from "../controllers/schedule.controller";

export async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.get("/:group/:subgroup", getSchedule);
  fastify.get("/:group/:subgroup/week/:week", getWeeklySchedule);
  fastify.get("/:group/:subgroup/month/:month", getMonthlySchedule);
  fastify.get("/subgroups", getAllSubgroups);
  fastify.get("/:group/combined/:subgroups", getCombinedSchedule);
}