import bcrypt from "bcrypt";
export const createHash = async (password) => {
    return await bcrypt.hash(password, 10);
};
export const compareHash = async (reqPassword, userPassword) => {
    return await bcrypt.compare(reqPassword, userPassword);
};
