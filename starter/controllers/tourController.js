//const fs = require('fs');
const { query } = require('express');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
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
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    // Execute query with features
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const tours = await features.query;

    // Send response
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours: tours.map(tour => ({
                ...tour._doc,
                isBookmarked: req.user && tour.bookmarkedBy ? tour.bookmarkedBy.includes(req.user._id) : false
            }))
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate('reviews');

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    // Add isBookmarked field
    const tourObj = tour.toObject();
    tourObj.isBookmarked = req.user && tour.bookmarkedBy
        ? tour.bookmarkedBy.some(id => id.toString() === req.user._id.toString())
        : false;

    res.status(200).json({
        status: 'success',
        data: {
            tour: tourObj
        }
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
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

exports.bookmarkTour = catchAsync(async (req, res, next) => {
    console.log('Bookmark attempt:', {
        tourId: req.params.id,
        userId: req.user._id
    });

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    console.log('Tour found:', {
        tourId: tour._id,
        bookmarkedBy: tour.bookmarkedBy || []
    });

    // Initialize bookmarkedBy array if it doesn't exist
    if (!Array.isArray(tour.bookmarkedBy)) {
        console.log('Initializing bookmarkedBy array');
        tour.bookmarkedBy = [];
    }

    // Check if tour is already bookmarked
    const isBookmarked = tour.bookmarkedBy.some(id => id?.toString() === req.user._id?.toString());
    console.log('Bookmark check:', {
        isBookmarked,
        userIdType: typeof req.user._id,
        userId: req.user._id?.toString()
    });

    if (isBookmarked) {
        return next(new AppError('Tour already bookmarked', 400));
    }

    // Add the bookmark
    tour.markModified('bookmarkedBy'); // Explicitly mark the array as modified
    tour.bookmarkedBy.push(req.user._id);
    console.log('Before save:', {
        bookmarkedBy: tour.bookmarkedBy.map(id => id.toString())
    });

    await tour.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'Tour bookmarked successfully'
    });
});

exports.unbookmarkTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    // Handle case where bookmarkedBy doesn't exist
    if (!tour.bookmarkedBy) {
        return next(new AppError('Tour not bookmarked', 400));
    }

    // Check if tour is bookmarked by comparing string versions of ObjectIds
    const isBookmarked = tour.bookmarkedBy.some(id => id.toString() === req.user._id.toString());
    if (!isBookmarked) {
        return next(new AppError('Tour not bookmarked', 400));
    }

    // Remove the bookmark
    tour.bookmarkedBy = tour.bookmarkedBy.filter(id => id.toString() !== req.user._id.toString());
    await tour.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'Tour unbookmarked successfully'
    });
});

exports.getMyBookmarks = catchAsync(async (req, res, next) => {
    const tours = await Tour.find({
        bookmarkedBy: req.user._id
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours: tours.map(tour => ({
                ...tour._doc,
                isBookmarked: true // These tours are all bookmarked since they're from the bookmarks list
            }))
        }
    });
});

exports.compareTours = catchAsync(async (req, res, next) => {
    const [tour1, tour2] = await Promise.all([
        Tour.findById(req.params.tourId1),
        Tour.findById(req.params.tourId2)
    ]);

    if (!tour1 || !tour2) {
        return next(new AppError('One or both tours not found', 404));
    }

    const comparison = {
        name: {
            tour1: tour1.name,
            tour2: tour2.name
        },
        duration: {
            tour1: tour1.duration,
            tour2: tour2.duration,
            difference: Math.abs(tour1.duration - tour2.duration)
        },
        maxGroupSize: {
            tour1: tour1.maxGroupSize,
            tour2: tour2.maxGroupSize,
            difference: Math.abs(tour1.maxGroupSize - tour2.maxGroupSize)
        },
        difficulty: {
            tour1: tour1.difficulty,
            tour2: tour2.difficulty,
            same: tour1.difficulty === tour2.difficulty
        },
        price: {
            tour1: tour1.price,
            tour2: tour2.price,
            difference: Math.abs(tour1.price - tour2.price)
        },
        ratingsAverage: {
            tour1: tour1.ratingsAverage,
            tour2: tour2.ratingsAverage,
            difference: Math.abs(tour1.ratingsAverage - tour2.ratingsAverage)
        }
    };

    res.status(200).json({
        status: 'success',
        data: {
            comparison
        }
    });
});
