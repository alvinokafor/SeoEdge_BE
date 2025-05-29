import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { handleResponse } from "../utils/index.js";
export function validateData(schema, // Support all Zod schema types
source = "body", // Default to validating `req.body`
customErrorMessage // Optional custom error message
) {
    return (req, res, next) => {
        try {
            schema.parse(req[source]); // Validate based on the specified source
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errorDetails = error.errors.map((issue) => ({
                    path: issue.path.join("."), // Include the path of the invalid field
                    message: issue.message,
                }));
                return handleResponse(res, StatusCodes.BAD_REQUEST, customErrorMessage || "Invalid input data", { details: errorDetails });
            }
            else {
                next(error); // Pass non-Zod errors to the error-handling middleware
            }
        }
    };
}
