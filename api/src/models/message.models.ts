import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
    sender: string;
    content: string;
}

const userSchema = new Schema({
    sender: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

export default model<IMessage>('Message', userSchema);