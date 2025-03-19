import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { handleResponse } from "../utils";

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
    }
  }
}

export const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return handleResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        "No authorization header"
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return handleResponse(res, StatusCodes.UNAUTHORIZED, "No token provided");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.accessToken = token;
      next();
    } catch (error) {
      return handleResponse(res, StatusCodes.UNAUTHORIZED, "Invalid token");
    }
  } catch (error) {
    next(error);
  }
};
