import { commonSchemas } from './common.schemas';
import { userSchemas } from './user.schemas';
import { lectureSchemas } from './lecture.schemas';
import { homeworkSchemas } from './homework.schemas';
import { authSchemas } from './auth.schemas';

export type SchemaType = {
  type: string;
  required?: string[];
  properties?: Record<string, any>;
  [key: string]: any;
};

export const schemas: Record<string, SchemaType> = {
  ...commonSchemas,
  ...userSchemas,
  ...lectureSchemas,
  ...homeworkSchemas,
  ...authSchemas
}; 