const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); // This allows us to access params from the parent route (tourId)
// Allow public access to view reviews
router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.protect,
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReviews
    );

router.route('/:id')
    .delete(reviewController.deleteReview)
    .get(reviewController.getReview);
module.exports = router;