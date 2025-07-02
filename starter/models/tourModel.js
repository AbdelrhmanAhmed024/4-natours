const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
const { path } = require('../app');
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true, // Removes extra whitespace
        maxlength: [40, 'A tour must have less than or equal to 40 characters'],
        minlength: [8, 'A tour must have less than or equal to 8 characters']
        //validate: [validator.isAlpha, 'name must only contain characters']
    },

    slug: String,

    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a group difficulty'],
        trim: true,
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty if either:easy ,medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) {
                return val < this.price;
            },
            message: 'Discount price should be less than regular price'
        }
    },
    summary: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    image: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number

        }
    ],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre('save', async function (next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     await Promise.all(guidesPromises);
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function (next) {
//     console.log('the document is saved ');
//     next();
// });

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

tourSchema.pre('aggregate', function (next) {

    this.pipeline().unshift({
        $match: {
            secretTour: { $ne: true }
        }
    });
    console.log(this.pipeline());
    next();
});

tourSchema.post(/^find/, function (doc, next) {
    console.log(`query took ${Date.now() - this.start} milliseconds!!`)
    // console.log(doc);
    next();
});


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

