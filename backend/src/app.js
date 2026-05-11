const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const healthRoutes = require("./routes/health.routes");
const chatRoutes = require("./routes/chat.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(healthRoutes);
app.use(chatRoutes);

app.use(errorMiddleware);

module.exports = app;
