import { StatusCodes } from "http-status-codes"

const errorHandlerMiddleware = (err, req, res, next) => {
    console.log(err);
    const defaultError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        // if there's already an error message passed in from a controller, use that error, otherwise use default:
        msg: err.message || 'Something went wrong, try again later'
    }
    if (err.name === "ValidationError") {
        defaultError.statusCode = StatusCodes.BAD_REQUEST
        // defaultError.msg = err.message
        defaultError.msg = Object.values(err.errors).map((item) => item.message).join(",")

    }
    if (err.code && err.code === 11000) {
        defaultError.statusCode = StatusCodes.BAD_REQUEST
        defaultError.msg = `A user with that ${Object.keys(err.keyValue)} already exists.`
    }
    res.status(defaultError.statusCode).json({ msg: defaultError.msg });
}

export default errorHandlerMiddleware;