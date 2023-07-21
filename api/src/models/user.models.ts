import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    role: string;
    permissions: [{ project: string, permission: string }];
    lastLogin: string;
    notifications: string[];
    tasks: string[];
}

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        required: true,
    },
    permissions: [
        {
            project: String,
            permission: String,
        },
    ],
    lastLogin: {
        type: String,
        default: '',
    },
    notifications: {
        type: [String],
        default: [],
    },
    tasks: {
        type: [String],
        default: [],
    },
});

export default model<IUser>('User', userSchema);