import express from "express";
import jsonwebtoken from "jsonwebtoken";
import { User } from "@models";
import { config } from "@config";
import { logger, responseSender } from "@utils";

function authToken(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const functionName = "authToken";
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  try {
    jsonwebtoken.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
      async (err: any, user: any) => {
        if (err)
          return responseSender.sendErrorResponse(res, 403, "Invalid token");
        if (user.tokenType !== config.tokenTypes.access)
          return responseSender.sendErrorResponse(res, 403, "Invalid token");
        const foundUser = await User.findOne({ userId: user.user.userId });
        if (!foundUser)
          return responseSender.sendErrorResponse(res, 404, "User not found");
        req.body.user = user.user;
        next();
      }
    );
  } catch (e: any) {
    logger.logError(functionName, e);
    return responseSender.sendErrorResponse(res, 500, "Internal server error");
  }
}

export default authToken;
