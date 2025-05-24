import { FastifyInstance } from "fastify";
import { getSchedule } from "../controllers/schedule.controller";

export default async function scheduleRoutes(fastify: FastifyInstance) {
  // Main schedule endpoint
  fastify.get("/:facultyId/:specializationShortName/:studyYear/:groupName/:subgroupIndex?", {
    schema: {
      tags: ['Schedule'],
      summary: 'Get schedule for a group',
      description: `
Get the schedule for a specific group in a faculty. Optionally specify a subgroup.

**Examples:**
- Get weekly schedule for main group: \`/api/schedule/1/C/1/3131?week=5\`
- Get weekly schedule for subgroup: \`/api/schedule/1/C/1/3131/b?week=5\`
- Get monthly schedule: \`/api/schedule/1/C/1/3131?month=3\`
- Get today's schedule: \`/api/schedule/1/C/1/3131?today=true\`

**Notes:**
- \`subgroupIndex\` is optional
- If no query parameters are provided, returns current week's schedule
- \`week\` parameter accepts values between 1-14
- \`month\` parameter accepts values between 1-12
- \`today\` parameter is a boolean flag
      `,
      params: {
        type: 'object',
        required: ['facultyId', 'specializationShortName', 'studyYear', 'groupName'],
        properties: {
          facultyId: { 
            type: 'string', 
            description: 'Faculty identifier (e.g., "1")'
          },
          specializationShortName: { 
            type: 'string', 
            description: 'Specialization short name (e.g., "C")'
          },
          studyYear: {
            type: 'string',
            description: 'Study year (e.g., "1")'
          },
          groupName: { 
            type: 'string', 
            description: 'Group name (e.g., "3131")'
          },
          subgroupIndex: { 
            type: 'string', 
            description: 'Optional subgroup index (e.g., "b")'
          }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          week: { 
            type: 'string', 
            description: 'Optional week number (1-14)'
          },
          month: { 
            type: 'string', 
            description: 'Optional month number (1-12)'
          },
          today: { 
            type: 'boolean', 
            description: 'Optional flag to get today\'s schedule'
          }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { 
              type: 'boolean',
              description: 'Operation success status'
            },
            facultyId: { 
              type: 'string',
              description: 'Faculty identifier'
            },
            groupName: { 
              type: 'string',
              description: 'Group name'
            },
            subgroupIndex: { 
              type: 'string',
              description: 'Subgroup index if applicable'
            },
            specializationShortName: { 
              type: 'string',
              description: 'Specialization short name'
            },
            studyYear: { 
              type: 'number',
              description: 'Study year'
            },
            isModular: { 
              type: 'boolean',
              description: 'Whether the schedule is modular'
            },
            data: {
              type: 'object',
              properties: {
                day: { 
                  type: 'number',
                  description: 'Day of the week (1-7)'
                },
                dayName: { 
                  type: 'string',
                  description: 'Name of the day'
                },
                weekNumber: { 
                  type: 'number',
                  description: 'Week number (1-14)'
                },
                month: { 
                  type: 'number',
                  description: 'Month number (1-12)'
                },
                parity: { 
                  type: 'string', 
                  enum: ['ODD', 'EVEN', 'ALL'],
                  description: 'Week parity'
                },
                courses: {
                  type: 'array',
                  description: 'List of courses',
                  items: {
                    type: 'object',
                    properties: {
                      id: { 
                        type: 'string',
                        description: 'Course ID'
                      },
                      code: { 
                        type: 'string',
                        description: 'Course code'
                      },
                      title: { 
                        type: 'string',
                        description: 'Course title'
                      },
                      type: { 
                        type: 'string', 
                        enum: ['LECTURE', 'LAB', 'SEMINAR'],
                        description: 'Course type'
                      },
                      startTime: { 
                        type: 'string',
                        description: 'Course start time (HH:mm)'
                      },
                      endTime: { 
                        type: 'string',
                        description: 'Course end time (HH:mm)'
                      },
                      duration: { 
                        type: 'number',
                        description: 'Course duration in minutes'
                      },
                      room: { 
                        type: 'string',
                        description: 'Room number'
                      },
                      teacher: { 
                        type: 'string',
                        description: 'Teacher name'
                      },
                      weekDay: { 
                        type: 'number',
                        description: 'Day of the week (1-7)'
                      }
                    }
                  }
                },
                schedule: {
                  type: 'array',
                  description: 'Weekly schedules for monthly view',
                  items: {
                    type: 'object',
                    properties: {
                      weekNumber: { 
                        type: 'number',
                        description: 'Week number (1-14)'
                      },
                      parity: { 
                        type: 'string', 
                        enum: ['ODD', 'EVEN', 'ALL'],
                        description: 'Week parity'
                      },
                      courses: {
                        type: 'array',
                        description: 'List of courses for the week',
                        items: {
                          type: 'object',
                          properties: {
                            id: { 
                              type: 'string',
                              description: 'Course ID'
                            },
                            code: { 
                              type: 'string',
                              description: 'Course code'
                            },
                            title: { 
                              type: 'string',
                              description: 'Course title'
                            },
                            type: { 
                              type: 'string', 
                              enum: ['LECTURE', 'LAB', 'SEMINAR'],
                              description: 'Course type'
                            },
                            startTime: { 
                              type: 'string',
                              description: 'Course start time (HH:mm)'
                            },
                            endTime: { 
                              type: 'string',
                              description: 'Course end time (HH:mm)'
                            },
                            duration: { 
                              type: 'number',
                              description: 'Course duration in minutes'
                            },
                            room: { 
                              type: 'string',
                              description: 'Room number'
                            },
                            teacher: { 
                              type: 'string',
                              description: 'Teacher name'
                            },
                            weekDay: { 
                              type: 'number',
                              description: 'Day of the week (1-7)'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Group or subgroup not found',
          type: 'object',
          properties: {
            success: { 
              type: 'boolean',
              description: 'Operation success status'
            },
            message: { 
              type: 'string',
              description: 'Error message'
            }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { 
              type: 'boolean',
              description: 'Operation success status'
            },
            message: { 
              type: 'string',
              description: 'Error message'
            }
          }
        }
      }
    }
  }, getSchedule);
  
}