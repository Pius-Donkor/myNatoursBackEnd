const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  const tours = await Tour.find();
  res.status(200).render('overview', { tours, title: 'All Tour' });
});

exports.getTour = catchAsync(async (req, res) => {
  const { slug } = req.params;
  // console.log(slug);
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  // console.log(tour);
  res.status(200).render('tour', { title: 'The forest hiker', tour });
});
