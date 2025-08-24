import mongoose from "mongoose";

export interface IVideo {
  _id: string;
  platform: "Youtube" | "TikTok" | "Instagram";
  title: string;
  user: string;
  views: number;
  category: "Cinematic/Storytelling" | "Comedy/Humor" | "Educational" | "Lifestyle" | "Trends/Viral";
  focus: "Sports" | "Fashion" | "Beauty" | "Health + Wellness" | "Tech + Gaming" | "Travel + Adventure";
  mood: "Calm" | "High Energy" | "Emotional" | "Funny/Lighthearted" | "Dramatic/Suspenseful";
  sponsoredContent: "Goods" | "Services" | "Events" | null;
  rating: number;
  url: string;
  instaEmbed: string;
  tiktokEmbed: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new mongoose.Schema<IVideo>(
  {
    platform: {
      type: String,
      required: true,
      enum: ["Youtube", "TikTok", "Instagram"],
    },
    title: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      required: true,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["Cinematic/Storytelling", "Comedy/Humor", "Educational", "Lifestyle", "Trends/Viral"],
    },
    focus: {
      type: String,
      required: true,
      enum: ["Sports", "Fashion", "Beauty", "Health + Wellness", "Tech + Gaming", "Travel + Adventure"],
    },
    mood: {
      type: String,
      required: true,
      enum: ["Calm", "High Energy", "Emotional", "Funny/Lighthearted", "Dramatic/Suspenseful"],
    },
    sponsoredContent: {
      type: String,
      required: false,
      enum: ["Goods", "Services", "Events"],
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 5,
    },
    url: {
      type: String,
      required: true,
    },
    instaEmbed: {
      type: String,
      required: false,
      default: "",
    },
    tiktokEmbed: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create indexes for better query performance
VideoSchema.index({ platform: 1, category: 1, focus: 1, mood: 1, rating: 1 });
VideoSchema.index({ views: -1 }); // For sorting by popularity
VideoSchema.index({ createdAt: -1 }); // For sorting by newest

export default mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema); 