const handleResponse = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({ message, ...data });
};
export default handleResponse;
