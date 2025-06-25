"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoClient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongoClient = async () => {
    if (!process.env.MONGO) {
        throw new Error("Missing MONGO environment variable.");
    }
    try {
        await mongoose_1.default.connect(process.env.MONGO);
        console.log('MongoDB connected');
    }
    catch (err) {
        if (err instanceof Error) {
            console.error('MongoDB connection failed:', err.message);
        }
        else {
            console.error('MongoDB connection failed:', err);
        }
        process.exit(1);
    }
};
exports.mongoClient = mongoClient;
