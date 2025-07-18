const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { model } = require('mongoose');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

    if (!doc) {
        return next(new AppError('no Document found', 404))
    };

    res.status(204).json({
        status: 'success',
        message: 'Document is deleted'
    })
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError('no Document is found', 404))
    };

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });

});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            data: newTour
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
        return next(new AppError('no Document is found', 404))
    };

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    // Allow nested routes
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };


    const features = new APIFeatures(Tour.find(filter), req.query) // Pass req.query correctly
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const doc = await features.query;

    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: doc.length,
        data: {
            data: doc,
        },
    });

});
