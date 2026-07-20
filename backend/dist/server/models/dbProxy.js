"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockStore = void 0;
exports.createModelProxy = createModelProxy;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Store in root of backend workspace to persist across hot-reloads
const DB_FILE_PATH = path_1.default.join(__dirname, '../../../mock_db.json');
const loadInMemData = () => {
    try {
        if (fs_1.default.existsSync(DB_FILE_PATH)) {
            const content = fs_1.default.readFileSync(DB_FILE_PATH, 'utf-8');
            return JSON.parse(content);
        }
    }
    catch (err) {
        console.error('Failed reading mock database file:', err);
    }
    // Pre-seed default login roles for easy access/testing
    const hashedPassword = bcryptjs_1.default.hashSync('password123', 10);
    const defaultUsers = [
        {
            _id: '60c72b2f9b1d8b22a84d2d4f',
            email: 'test_new_user@test.com',
            password: hashedPassword,
            role: 'Business Owner',
            isVerified: true,
            profile: { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            _id: '60c72b2f9b1d8b22a84d2d50',
            email: 'officer@example.com',
            password: hashedPassword,
            role: 'Bank Officer',
            isVerified: true,
            profile: { firstName: 'Amit', lastName: 'Sharma', phone: '9876543211' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            _id: '60c72b2f9b1d8b22a84d2d51',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'Admin',
            isVerified: true,
            profile: { firstName: 'Sanjay', lastName: 'Verma', phone: '9876543212' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
    const data = { User: defaultUsers };
    try {
        fs_1.default.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (err) { }
    return data;
};
const inMemData = loadInMemData();
const saveInMemData = () => {
    try {
        const dir = path_1.default.dirname(DB_FILE_PATH);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.writeFileSync(DB_FILE_PATH, JSON.stringify(inMemData, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Failed writing mock database file:', err);
    }
};
const getMockStore = (modelName) => {
    if (!inMemData[modelName]) {
        inMemData[modelName] = [];
        saveInMemData();
    }
    return inMemData[modelName];
};
exports.getMockStore = getMockStore;
function createModelProxy(modelName, mongooseModel) {
    return new Proxy(mongooseModel, {
        get(target, prop, receiver) {
            // Connect check
            const isConnected = mongoose_1.default.connection.readyState === 1;
            if (isConnected) {
                return Reflect.get(target, prop, receiver);
            }
            const store = (0, exports.getMockStore)(modelName);
            if (prop === 'create') {
                return async (doc) => {
                    const newDoc = {
                        _id: new mongoose_1.default.Types.ObjectId(),
                        ...doc,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        save: async function () {
                            const idx = store.findIndex(r => r._id.toString() === this._id.toString());
                            if (idx !== -1) {
                                store[idx] = this;
                            }
                            else {
                                store.push(this);
                            }
                            saveInMemData();
                            return this;
                        },
                        deleteOne: async function () {
                            const idx = store.findIndex(r => r._id.toString() === this._id.toString());
                            if (idx !== -1) {
                                store.splice(idx, 1);
                                saveInMemData();
                            }
                            return { deletedCount: 1 };
                        }
                    };
                    store.push(newDoc);
                    saveInMemData();
                    return newDoc;
                };
            }
            if (prop === 'find') {
                return (filter = {}) => {
                    let results = [...store];
                    if (filter.business) {
                        results = results.filter(r => r.business?.toString() === filter.business.toString());
                    }
                    if (filter.owner) {
                        results = results.filter(r => r.owner?.toString() === filter.owner.toString());
                    }
                    if (filter.user) {
                        results = results.filter(r => r.user?.toString() === filter.user.toString());
                    }
                    if (filter.email) {
                        results = results.filter(r => r.email === filter.email);
                    }
                    const queryObj = {
                        populate: () => queryObj,
                        sort: () => queryObj,
                        skip: () => queryObj,
                        limit: (lim) => {
                            results = results.slice(0, lim);
                            return queryObj;
                        },
                        then: (resolve) => {
                            if (typeof resolve === 'function') {
                                resolve(results);
                            }
                        }
                    };
                    return queryObj;
                };
            }
            if (prop === 'findOne') {
                return (filter = {}) => {
                    let results = [...store];
                    if (filter.email) {
                        results = results.filter(r => r.email === filter.email);
                    }
                    if (filter.business) {
                        results = results.filter(r => r.business?.toString() === filter.business.toString());
                    }
                    const found = results[0] || null;
                    if (found && !found.save) {
                        found.save = async function () {
                            const idx = store.findIndex(r => r._id.toString() === this._id.toString());
                            if (idx !== -1) {
                                store[idx] = this;
                            }
                            saveInMemData();
                            return this;
                        };
                        found.deleteOne = async function () {
                            const idx = store.findIndex(r => r._id.toString() === this._id.toString());
                            if (idx !== -1) {
                                store.splice(idx, 1);
                                saveInMemData();
                            }
                            return { deletedCount: 1 };
                        };
                    }
                    const queryObj = {
                        populate: () => queryObj,
                        sort: () => queryObj,
                        then: (resolve) => {
                            if (typeof resolve === 'function') {
                                resolve(found);
                            }
                        }
                    };
                    return queryObj;
                };
            }
            if (prop === 'findById') {
                return (id) => {
                    const found = store.find(r => r._id.toString() === id.toString()) || null;
                    if (found && !found.save) {
                        found.save = async function () {
                            const idx = store.findIndex(r => r._id.toString() === this._id.toString());
                            if (idx !== -1) {
                                store[idx] = this;
                            }
                            saveInMemData();
                            return this;
                        };
                        found.deleteOne = async function () {
                            const idx = store.findIndex(r => r._id.toString() === this._id.toString());
                            if (idx !== -1) {
                                store.splice(idx, 1);
                                saveInMemData();
                            }
                            return { deletedCount: 1 };
                        };
                    }
                    const queryObj = {
                        populate: () => queryObj,
                        then: (resolve) => {
                            if (typeof resolve === 'function') {
                                resolve(found);
                            }
                        }
                    };
                    return queryObj;
                };
            }
            if (prop === 'insertMany') {
                return async (docs) => {
                    const newDocs = docs.map(d => ({
                        _id: new mongoose_1.default.Types.ObjectId(),
                        ...d,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }));
                    store.push(...newDocs);
                    saveInMemData();
                    return newDocs;
                };
            }
            if (prop === 'countDocuments') {
                return async (filter = {}) => {
                    return store.length;
                };
            }
            if (prop === 'deleteMany') {
                return async (filter = {}) => {
                    let count = 0;
                    if (Object.keys(filter).length === 0) {
                        count = store.length;
                        store.length = 0;
                    }
                    else {
                        for (let i = store.length - 1; i >= 0; i--) {
                            const item = store[i];
                            let match = true;
                            for (const k of Object.keys(filter)) {
                                if (item[k] !== filter[k]) {
                                    match = false;
                                    break;
                                }
                            }
                            if (match) {
                                store.splice(i, 1);
                                count++;
                            }
                        }
                    }
                    saveInMemData();
                    return { deletedCount: count };
                };
            }
            if (prop === 'deleteOne') {
                return async (filter = {}) => {
                    const idx = store.findIndex(r => r._id.toString() === filter._id?.toString());
                    if (idx !== -1) {
                        store.splice(idx, 1);
                        saveInMemData();
                    }
                    return { deletedCount: 1 };
                };
            }
            if (prop === 'updateMany') {
                return async (filter = {}, update = {}) => {
                    if (update.isRead !== undefined) {
                        store.forEach(r => {
                            if (r.user?.toString() === filter.user?.toString()) {
                                r.isRead = update.isRead;
                            }
                        });
                        saveInMemData();
                    }
                    return { modifiedCount: store.length };
                };
            }
            return Reflect.get(target, prop, receiver);
        }
    });
}
