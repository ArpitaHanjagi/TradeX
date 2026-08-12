import { Schema, model, models, type Document, type Model } from "mongoose";

export interface AlertItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: 'upper' | 'lower';
    threshold: number;
    createdAt: Date;
}

const AlertSchema = new Schema<AlertItem>({
    userId: { type: String, required: true },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    company: { type: String, required: true, trim: true },
    alertName: { type: String, required: true, trim: true },
    alertType: { type: String, enum: ['upper', 'lower'], required: true },
    threshold: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

AlertSchema.index({ userId: 1 });

export const AlertModel: Model<AlertItem> =
    models?.Alert || model<AlertItem>("Alert", AlertSchema, "alerts");
