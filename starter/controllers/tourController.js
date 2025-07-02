//const fs = require('fs');
const { query } = require('express');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./hadelerFactory')
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));
// exports.checkId = (req, res, next, val) => {
//     console.log(`tour id ${val}`)
//     if (req.params.id * 1 > tours.length) {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'invalid ID'
//         });
//     };
//     next();
// };
exports.aliasTopTours = (req, res, next) => {
    this.queryString.limit = '5';
    this.queryString.sort = '-ratingsAverage,price';
    this.queryString.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);
// catchAsync(async (req, res, next) => {

//     const tour = await Tour.findByIdAndDelete(req.params.id)

//     if (!tour) {
//         return next(new AppError('no tour found', 404))
//     };

//     res.status(204).json({
//         status: 'success',
//         message: 'tour is deleted'
//     })
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: {
                ratingsAverage: { $gte: 4.5 }
            },
        },
        {
            $group: {
                _id: '$difficulty',
                num: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        },

    ]);
    res.status(200).json({
        status: 'Success',
        data: {
            stats
        }
    })

});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numToursStarts: 1 }
        },
        {
            $limit: 12
        }
    ]);
    res.status(200).json({
        status: 'Success',
        data: {
            plan
        }
    });
});
