import { Document, Types } from "mongoose";

export interface ITeacher {
  _id: Types.ObjectId;
  name: string;
}

export interface ICourse {
  _id: Types.ObjectId;
  code: string;
  title: string;
  type: "LAB" | "CURS" | "SEMINAR";
  room: string;
  teacher: ITeacher;
}

export interface ISchedulePopulated extends Document {
  _id: Types.ObjectId;
  group: Types.ObjectId;
  subgroup: string;
  weekDay: number;
  startHour: string;
  duration: number;
  course: ICourse; // Burası önemli: Populated Course olacak
  parity: "EVEN" | "ODD" | "BOTH";
}
