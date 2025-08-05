const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObj[el] = obj[el]
        };
    });
    return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find().select('+active');

    // Filter out inactive users
    const activeUsers = users.filter(user => user.active !== false);

    res.status(200).json({
        status: 'success',
        results: activeUsers.length,
        data: {
            users: activeUsers
        }
    });
});
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.CreateUser = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });

    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('this route is not for password updates. pls use /updateMyPassword', 400));
    };
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        date: {
            user: updatedUser
        }
    });

});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        date: null
    });

});

exports.updateUser = catchAsync(async (req, res, next) => {
    // Don't allow password updates with this route
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword', 400));
    }

    // Filter unwanted fields that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email', 'role');

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true,
        runValidators: true
    });

    if (!updatedUser) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    // Check if user is trying to delete themselves
    if (req.user && req.user.id === req.params.id) {
        return next(new AppError('You cannot delete your own admin account', 403));
    }

    // Perform hard delete
    await User.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'this route is not yet defined'
//     });
// };
