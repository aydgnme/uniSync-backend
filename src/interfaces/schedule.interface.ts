import { Document } from "mongoose";

export interface ISchedule extends Document {
  group: string;        // e.g., "3141"
  subgroup: string;     // e.g., "a"
  weekDay: number;      // 1 (Monday) - 7 (Sunday)
  startHour: string;    // "08:00"
  duration: number;     // in minutes
  code: string;         // e.g., "RF"
  title: string;        // e.g., "Recunoaşterea formelor"
  type: "LECTURE" | "LAB" | "SEMINAR"; // (not CURS, standardizing)
  room: string;         // e.g., "D Amf. DH"
  teacher: string;      // e.g., "Pentiuc Ş."
  parity: "ODD" | "EVEN" | "BOTH"; // Which weeks it belongs to
}

export interface GetWeeklyScheduleParams {
  group: string;
  subgroup: string;
  weekNumber: string;
}