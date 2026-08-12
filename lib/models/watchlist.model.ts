import { Schema, model, models, type Document, type Model } from "mongoose";

export interface WatchlistItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
}

const WatchlistSchema = new Schema<WatchlistItem>({
    userId: { type: String, required: true },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    company: { type: String, required: true, trim: true },
    addedAt: { type: Date, default: Date.now },
});

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Watchlist: Model<WatchlistItem> =
    models?.Watchlist || model<WatchlistItem>("Watchlist", WatchlistSchema, "watchlists");
