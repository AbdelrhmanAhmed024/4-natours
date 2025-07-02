# Natours API

A complete Node.js RESTful API for a fictional tours company, built as part of a backend learning project. This project demonstrates advanced Node.js, Express, MongoDB, and Mongoose concepts, including authentication, authorization, data modeling, and more.

## Features

- User authentication and authorization (JWT, roles)
- CRUD operations for tours, users, and reviews
- Advanced filtering, sorting, pagination
- Data validation and error handling
- Virtual fields and population (e.g., reviews on tours)
- File uploads and static file serving
- Environment configuration

## Project Structure

```
starter/
  app.js
  config.env
  package.json
  server.js
  controllers/
  dev-data/
  models/
  public/
  routes/
  utils/
```

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/AbdelrhmanAhmed024/4-natours.git
   cd 4-natours/starter
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your environment variables:
   - Copy `config.env` and update values as needed (MongoDB URI, JWT secret, etc.)

### Running the App

```sh
npm start
```

The server will run on the port specified in `config.env` (default: 3000).

### Importing Sample Data

To import development data:

```sh
node dev-data/data/import-dev-data.js --import
```

To delete all data:

```sh
node dev-data/data/import-dev-data.js --delete
```

## API Endpoints

- `/api/v1/tours` - Tours CRUD and queries
- `/api/v1/users` - User management
- `/api/v1/reviews` - Reviews for tours

## Author

Abdelrhman Ahmed

## License

This project is for educational purposes only.
