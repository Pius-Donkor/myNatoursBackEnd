// eslint-disable-next-line import/no-extraneous-dependencies
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION ! 💥 : server shutting down');
  console.log(err.name, err.message);
  process.exit(1);
});
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => console.log('DB connections successful'));

// const { type } = require('os');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('app is running on the server', port);
});

// this is a way to globally handle errors outside the express application , eg: when the database is down for some reason
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION ! 💥 : server shutting down ');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
