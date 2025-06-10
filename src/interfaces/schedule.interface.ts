export interface ISchedule {
  facultyId: string;
  groupId: string;
  groupName: string;
  subgroupIndex?: string;
  specializationShortName: string;
  studyYear: number;
  isModular: boolean;
  weekNumber: number;
  parity: "ODD" | "EVEN" | "ALL";
  courses: Array<{
    id: string;
    code: string;
    title: string;
    type: "LECTURE" | "LAB" | "SEMINAR";
    startTime: string;
    endTime: string;
    duration: number;
    room: string;
    teacher: string;
    weekDay: number;
  }>;
}

export interface GetWeeklyScheduleParams {
  facultyId: string;
  specializationShortName: string;
  groupName: string;
  subgroupIndex?: string;
  weekNumber: string;
}

export interface GetMonthlyScheduleParams {
  facultyId: string;
  specializationShortName: string;
  groupName: string;
  subgroupIndex?: string;
  month: string;
}

export interface GetTodayScheduleParams {
  facultyId: string;
  specializationShortName: string;
  groupName: string;
  subgroupIndex?: string;
}