import logger from "../../config/logger.js";
import { StatusCodes } from "http-status-codes";
import { handleResponse } from "../../utils/index.js";
class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async handleRegistration(req, res, next) {
        try {
            const { email, password, firstName, lastName } = req.body;
            // check if user already exists in the system
            const user = await this.authService.checkIfUserExists(email);
            if (user?.data?.length === 1) {
                return handleResponse(res, StatusCodes.CONFLICT, `User with email ${user.data[0].email} already exists`);
            }
            // Create auth user
            const authResponse = await this.authService.createAuthUser(email, password, firstName, lastName);
            // Check if an error occurred during auth user creation
            if (authResponse?.error) {
                return handleResponse(res, StatusCodes.BAD_REQUEST, `Failed to create user`, { error: authResponse.error });
            }
            return handleResponse(res, StatusCodes.CREATED, "Auth user created successfully", { auth_id: authResponse?.auth_id });
        }
        catch (err) {
            logger.error(`Something went wrong: ${err}`);
            next(err);
        }
    }
    async handleLogin(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await this.authService.signInUser(email, password);
            if (user?.error) {
                return handleResponse(res, StatusCodes.UNAUTHORIZED, user.error, {
                    status: user.status,
                });
            }
            return handleResponse(res, StatusCodes.OK, "Login Successful", {
                user: user.user,
                session: user.session,
            });
        }
        catch (err) {
            logger.error(`Unexpected error: ${err}`);
            next(err);
        }
    }
    async handleVerifyEmailAuth(req, res, next) {
        try {
            const { otp, email } = req.body;
            //verify user's email from otp
            const user = await this.authService.verifyEmailAuth(email, otp);
            if (user?.error) {
                return handleResponse(res, StatusCodes.BAD_REQUEST, "Failed to verify user", {
                    error: user.error,
                });
            }
            return handleResponse(res, StatusCodes.OK, "User verified successfully", {
                user: user.user,
            });
        }
        catch (err) {
            logger.error(`Unexpected error: ${err}`);
            next(err);
        }
    }
    async handleResendOtp(req, res, next) {
        try {
            const { email } = req.body;
            const resendRes = await this.authService.resendOtp(email);
            if (resendRes.error) {
                return handleResponse(res, StatusCodes.BAD_REQUEST, "Something went wrong sending otp", { error: resendRes.error });
            }
            return handleResponse(res, StatusCodes.OK, "Otp resent successfully", {
                data: resendRes.data,
            });
        }
        catch (error) {
            logger.error(`Unexpected error: ${error}`);
            next(error);
        }
    }
    async handleSendPasswordResetEmail(req, res, next) {
        try {
            const { email } = req.body;
            const { data, error } = await this.authService.sendResetPasswordEmail(email);
            if (error) {
                return handleResponse(res, StatusCodes.BAD_REQUEST, "Something went wrong sending password reset email", { error: error });
            }
            return handleResponse(res, StatusCodes.OK, "Password reset email sent successfully");
        }
        catch (error) {
            logger.error(`Unexpected error: ${error}`);
            next(error);
        }
    }
    async handlePasswordReset(req, res, next) {
        try {
            const { password, refreshToken } = req.body;
            const accessToken = req.accessToken;
            const { data, error } = await this.authService.updateUserPassword(password, accessToken, refreshToken);
            if (error) {
                return handleResponse(res, StatusCodes.BAD_REQUEST, "Something went wrong resetting user's password", { error: error });
            }
            return handleResponse(res, StatusCodes.OK, "Password reset successfully", { data: data });
        }
        catch (error) {
            logger.error(`Unexpected error: ${error}`);
            next(error);
        }
    }
}
export default AuthController;
