import { FastifyInstance } from "fastify";
import { getMySchedule, getScheduleByGroup, getWeeklySchedule, getSummarizedSchedule } from "../controllers/schedule.controller";
import { authJWT } from "../middlewares/auth.jwt.middleware";

export default async function scheduleRoutes(fastify: FastifyInstance) {
  // Add JWT authentication hook for all routes
  fastify.addHook('onRequest', authJWT);

  // Get summarized schedule
  fastify.get("/summarized", {
    schema: {
      tags: ['Schedule'],
      summary: 'Get summarized schedule',
      description: 'Get a summarized version of the schedule for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  courseCode: { type: 'string' },
                  courseTitle: { type: 'string' },
                  courseType: { type: 'string', enum: ['LECTURE', 'SEMINAR', 'LAB'] },
                  teacherName: { type: 'string' },
                  weekDay: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                  startTime: { type: 'string', format: 'time' },
                  endTime: { type: 'string', format: 'time' },
                  room: { type: 'string' }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, getSummarizedSchedule);

  // Get my schedule
  fastify.get("/my", {
    schema: {
      tags: ['Schedule'],
      summary: 'Get my schedule',
      description: 'Get the schedule for the currently authenticated student',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scheduleId: { type: 'string', format: 'uuid' },
                  courseId: { type: 'string', format: 'uuid' },
                  courseCode: { type: 'string' },
                  courseTitle: { type: 'string' },
                  courseType: { type: 'string', enum: ['LECTURE', 'SEMINAR', 'LAB'] },
                  teacherName: { type: 'string' },
                  weekDay: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                  startTime: { type: 'string', format: 'time' },
                  endTime: { type: 'string', format: 'time' },
                  room: { type: 'string' },
                  parity: { type: 'string', enum: ['ODD', 'EVEN', 'ALL'] },
                  groupId: { type: 'string', format: 'uuid' },
                  groupName: { type: 'string' },
                  groupIndex: { type: 'string' },
                  weeks: { 
                    type: 'array',
                    items: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, getMySchedule);

  // Get weekly schedule
  fastify.get("/", {
    schema: {
      tags: ['Schedule'],
      summary: 'Get weekly schedule',
      description: 'Get schedules for past and future weeks',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          pastWeeks: {
            type: 'number',
            description: 'Number of past weeks to fetch',
            default: 1
          },
          futureWeeks: {
            type: 'number',
            description: 'Number of future weeks to fetch',
            default: 1
          }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                past: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      scheduleId: { type: 'string', format: 'uuid' },
                      courseId: { type: 'string', format: 'uuid' },
                      courseCode: { type: 'string' },
                      courseTitle: { type: 'string' },
                      courseType: { type: 'string', enum: ['LECTURE', 'SEMINAR', 'LAB'] },
                      teacherName: { type: 'string' },
                      weekDay: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                      startTime: { type: 'string', format: 'time' },
                      endTime: { type: 'string', format: 'time' },
                      room: { type: 'string' },
                      parity: { type: 'string', enum: ['ODD', 'EVEN', 'ALL'] },
                      groupId: { type: 'string', format: 'uuid' },
                      groupName: { type: 'string' },
                      groupIndex: { type: 'string' },
                      weeks: { 
                        type: 'array',
                        items: { type: 'number' }
                      }
                    }
                  }
                },
                future: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      scheduleId: { type: 'string', format: 'uuid' },
                      courseId: { type: 'string', format: 'uuid' },
                      courseCode: { type: 'string' },
                      courseTitle: { type: 'string' },
                      courseType: { type: 'string', enum: ['LECTURE', 'SEMINAR', 'LAB'] },
                      teacherName: { type: 'string' },
                      weekDay: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                      startTime: { type: 'string', format: 'time' },
                      endTime: { type: 'string', format: 'time' },
                      room: { type: 'string' },
                      parity: { type: 'string', enum: ['ODD', 'EVEN', 'ALL'] },
                      groupId: { type: 'string', format: 'uuid' },
                      groupName: { type: 'string' },
                      groupIndex: { type: 'string' },
                      weeks: { 
                        type: 'array',
                        items: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, getWeeklySchedule);

  // Get schedule by group ID
  fastify.get("/group", {
    schema: {
      tags: ['Schedule'],
      summary: 'Get my group schedule',
      description: 'Get schedule for the authenticated student\'s group',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          week: {
            type: 'number',
            description: 'Week number'
          },
          month: {
            type: 'number',
            description: 'Month number'
          },
          today: {
            type: 'boolean',
            description: 'Get today\'s schedule'
          },
          parity: {
            type: 'string',
            enum: ['ODD', 'EVEN', 'ALL'],
            description: 'Week parity'
          }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scheduleId: { type: 'string', format: 'uuid' },
                  courseId: { type: 'string', format: 'uuid' },
                  courseCode: { type: 'string' },
                  courseTitle: { type: 'string' },
                  courseType: { type: 'string', enum: ['LECTURE', 'SEMINAR', 'LAB'] },
                  teacherName: { type: 'string' },
                  weekDay: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                  startTime: { type: 'string', format: 'time' },
                  endTime: { type: 'string', format: 'time' },
                  room: { type: 'string' },
                  parity: { type: 'string', enum: ['ODD', 'EVEN', 'ALL'] },
                  groupId: { type: 'string', format: 'uuid' },
                  groupName: { type: 'string' },
                  groupIndex: { type: 'string' },
                  weeks: { 
                    type: 'array',
                    items: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Schedule not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, getScheduleByGroup);
}