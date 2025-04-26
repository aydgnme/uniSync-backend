import dotenv from "dotenv";
dotenv.config();

let config = {
  /*
  actually we will use only access token as a principal token.
  since it has only 1 points :D
  */
  tokenTypes: {
    access: "access",
    refresh: "refresh",
  },

  tokenExpirations: {
    /* 
    we didn't want to spend time 
    to write function for refreshing the token in the frontend in
    every 5 minutes beacuse it has only 1 points. 
    So we put access token to expire in 1 day xD
    and we will use accessToken as a principal token. 
    we could do that overengineered refresh token logic 
    if it had somehow more points. :)
    */
    access: "1d",
    refresh: "14d",
  },

  roles: {
    admin: "admin",
    worker: "worker",
    projectManager: "ProjectManager",
    DepartmentManager: "DepartmentManager",
  },
  registrationMethods: {
    email: "email",
  },
};

export default config;
