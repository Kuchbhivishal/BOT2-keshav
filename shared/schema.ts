import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (web app users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture"),
  walletBalance: doublePrecision("wallet_balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Influencers table
export const influencers = pgTable("influencers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  handle: text("handle").notNull().unique(),
  isVerified: boolean("is_verified").notNull().default(false),
  isOnline: boolean("is_online").notNull().default(false),
  messageCost: doublePrecision("message_cost").notNull().default(20),
  audioCost: doublePrecision("audio_cost").notNull().default(150),
  videoCost: doublePrecision("video_cost").notNull().default(250),
  walletBalance: doublePrecision("wallet_balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  influencerId: integer("influencer_id").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  cost: doublePrecision("cost").notNull(),
  senderType: text("sender_type").notNull(), // 'user' or 'influencer'
  senderId: integer("sender_id").notNull(),    // ID of the sender (either user_id or influencer_id)
  receiverId: integer("receiver_id").notNull(), // ID of the receiver (either user_id or influencer_id)
  timestamp: timestamp("timestamp").defaultNow().notNull(), // For sorting messages
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  influencerId: integer("influencer_id").notNull(),
  callType: text("call_type").notNull(), // 'audio' or 'video'
  durationMinutes: integer("duration_minutes").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'completed', 'cancelled'
  totalCost: doublePrecision("total_cost").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  influencerId: integer("influencer_id"),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'deposit', 'message', 'audio', 'video', 'content', 'withdrawal'
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content posts table
export const contentPosts = pgTable("content_posts", {
  id: serial("id").primaryKey(),
  influencerId: integer("influencer_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contentType: text("content_type").notNull().default("text"), // 'image', 'video', 'text'
  mediaUrl: text("media_url"),
  previewUrl: text("preview_url"),
  contentUrl: text("content_url"),
  price: doublePrecision("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User content purchases
export const contentPurchases = pgTable("content_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  paidAmount: doublePrecision("paid_amount").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  walletBalance: true,
});

export const insertInfluencerSchema = createInsertSchema(influencers).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  isOnline: true,
  walletBalance: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
  timestamp: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertContentPostSchema = createInsertSchema(contentPosts).omit({
  id: true,
  createdAt: true,
});

export const insertContentPurchaseSchema = createInsertSchema(contentPurchases).omit({
  id: true,
  purchasedAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type Influencer = typeof influencers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ContentPost = typeof contentPosts.$inferSelect;
export type ContentPurchase = typeof contentPurchases.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertContentPost = z.infer<typeof insertContentPostSchema>;
export type InsertContentPurchase = z.infer<typeof insertContentPurchaseSchema>;
