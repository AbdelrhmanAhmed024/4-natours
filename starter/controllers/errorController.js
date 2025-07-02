const AppError = require("./../utils/appError");

const handelCastErrorDB = err => {
    const message = `invaled ${err.path}:${err.value}`
    return new AppError(message, 400);
};

const handelDuplicateFieldsDB = err => {
    const value = Object.values(err.keyValue)[0]; // Extract duplicate value
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handelValidationErrorDB = err => {
    const errors = Object.values(err.erros).map(el => el.message)
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handelJWTError = err => {
    new AppError('Invalid token , log in again', 401)
};

const handelJWTExpiredError = err => {
    new AppError('Token Expired , log in again', 401)
};

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: 'something is very fucked up'
        })

    }
};



module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = JSON.parse(JSON.stringify(err)); // Deep copy to preserve properties

        if (error.name === 'CastError') error = handelCastErrorDB(error);
        if (error.code === 11000) error = handelDuplicateFieldsDB(error); // ✅ Fix applied
        if (error.name === 'ValidationalError') error = handelValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handelJWTError(error);
        if (error.name === 'TokenExpiredError') error = handelJWTExpiredError(error);
        sendErrorProd(error, res);
    }
};