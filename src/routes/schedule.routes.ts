import { FastifyInstance } from "fastify";
import { getSchedule, getWeeklySchedule, getMonthlySchedule, getAllSubgroups, getTodaySchedule } from "../controllers/schedule.controller";

export default async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.get("/:group/:subgroup", getSchedule);
  fastify.get("/:group/:subgroup/:weekNumber", getWeeklySchedule);
  fastify.get("/:group/:subgroup/month/:month", getMonthlySchedule);
  fastify.get("/subgroups", getAllSubgroups);
  fastify.get("/today/:group/:subgroup", getTodaySchedule);
}