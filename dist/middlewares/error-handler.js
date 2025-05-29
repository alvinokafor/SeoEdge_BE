import { ApiError } from "../lib/errors.js";
import logger from "../config/logger.js";
import { StatusCodes } from "http-status-codes";
export const errorHandler = (error, _req, res, _next) => {
    if (error instanceof ApiError) {
        res.status(error.code).json({ message: error.message });
    }
    else {
        logger.error(error.message);
        res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Internal Server Error" });
    }
};
