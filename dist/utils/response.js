export const handleResponse = (res, statusCode, message, data, errors) => {
    const response = {
        message,
        ...(data && { data }),
        ...(errors && { errors }),
    };
    res.status(statusCode).json(response);
};
