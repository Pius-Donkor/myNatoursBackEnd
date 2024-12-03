const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,summary,difficulty,ratingAverage';
  next();
};

exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour= new Tour(req.body)
  // newTour.save()
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.getAllTours = catchAsync(async (req, res, next) => {
  // console.log(req.query);

  // EXECUTE QUERY

  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    length: tours.length,
    data: { tours }
  });
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // sometimes when the id string is valid but not correct, so in order to properly handle such an error this is what we need to do.
  if (!tour) {
    return next(new AppError('could not find tour with this ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { tour }
  });

  // if (!tour.id) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'invalid ID'
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError('could not find tour with this ID', 404));
  }
  res.status(200).json({
    status: 'success',
    tour
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndRemove(req.params.id);
  if (!tour) {
    return next(new AppError('could not find tour with this ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    { $sort: { avgRating: 1 } }
    // { $match: { _id: { $ne: 'easy' } } }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
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
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    { $addFields: { month: '$_id' } },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $project: { _id: 0 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan }
  });
});
