const app = require('./app');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    console.log('Uncaught Exception!!!');
    console.log(err.name, err.message);
    process.exit(1);
});


const mongoose = require('mongoose')
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
mongoose.connect(DB, {
    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false
}).then(() => console.log('Connected to MongoDB!'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));



const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`runnig on port ${port}`);
});

process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection! Shutting down...');
    console.error(`Error: ${err.name} - ${err.message}`);

    server.close(() => {
        process.exit(1);
    });
});

// Handle synchronous errors (e.g., missing variables, syntax errors)
process.on('uncaughtException', err => {
    console.error('Uncaught Exception! Shutting down...');
    console.error(`Error: ${err.name} - ${err.message}`);

    process.exit(1); // No need for `server.close()` since startup failed
});


