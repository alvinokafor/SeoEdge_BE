import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { handleResponse } from '../utils/index.js';
export const verifyJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return handleResponse(res, StatusCodes.UNAUTHORIZED, 'No authorization header');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return handleResponse(res, StatusCodes.UNAUTHORIZED, 'No token provided');
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.userId;
            req.accessToken = token;
            next();
            // return res.status(204);
        }
        catch (error) {
            return handleResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid token');
        }
    }
    catch (error) {
        next(error);
    }
};
