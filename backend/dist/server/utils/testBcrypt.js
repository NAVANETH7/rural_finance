"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const testHash = async () => {
    const password = 'password123';
    const salt = await bcryptjs_1.default.genSalt(10);
    const hash = await bcryptjs_1.default.hash(password, salt);
    console.log('Bcryptjs generated hash:', hash);
    const predefinedHash = '$2a$10$vK3t/0qYn9rW3Mv9hM4Ueu7cpeqPZ.O3PzT9MwqK7m4hE07L91V6y';
    const isMatch = await bcryptjs_1.default.compare(password, predefinedHash);
    console.log('Does predefined hash match password123?:', isMatch);
};
testHash();
