const express = require('express');
const Router = express.Router();
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const { Admin } = require('mongodb');


Router.use('/:tourId/reviews', reviewRouter); // Mount the review router on the tour router

//Router.param('id', tourController.checkId)
Router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours)
Router.route('/tour-stats').get(tourController.getTourStats)
Router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)


Router.route('/').get(authController.protect, tourController.getAllTours).post(tourController.createTour);
Router.route('/:id').get(tourController.getTour).patch(tourController.updateTour).delete(authController.protect, authController.restrictTo("admin", "lead-guide"), tourController.deleteTour);



module.exports = Router;