"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const business_1 = __importDefault(require("./routes/business"));
const transaction_1 = __importDefault(require("./routes/transaction"));
const prediction_1 = __importDefault(require("./routes/prediction"));
const risk_1 = __importDefault(require("./routes/risk"));
const recommendation_1 = __importDefault(require("./routes/recommendation"));
const loan_1 = __importDefault(require("./routes/loan"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const report_1 = __importDefault(require("./routes/report"));
const notification_1 = __importDefault(require("./routes/notification"));
const admin_1 = __importDefault(require("./routes/admin"));
const copilot_1 = __importDefault(require("./routes/copilot"));
const scheme_1 = __importDefault(require("./routes/scheme"));
const simulation_1 = __importDefault(require("./routes/simulation"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Database Connections
(0, db_1.connectDB)();
(0, redis_1.connectRedis)();
// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
    });
});
// Expose Socket.IO client globally on request
app.use((req, res, next) => {
    req.io = io;
    next();
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// API Routes Mounting
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/business', business_1.default);
app.use('/api/v1/transactions', transaction_1.default);
app.use('/api/v1/predictions', prediction_1.default);
app.use('/api/v1/risk', risk_1.default);
app.use('/api/v1/recommendations', recommendation_1.default);
app.use('/api/v1/loans', loan_1.default);
app.use('/api/v1/analytics', analytics_1.default);
app.use('/api/v1/reports', report_1.default);
app.use('/api/v1/notifications', notification_1.default);
app.use('/api/v1/admin', admin_1.default);
app.use('/api/v1/copilot', copilot_1.default);
app.use('/api/v1/schemes', scheme_1.default);
app.use('/api/v1/simulation', simulation_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`AI Rural Finance Backend running on port ${PORT}`);
});
