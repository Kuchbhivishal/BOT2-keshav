import { 
  users, type User, type InsertUser,
  influencers, type Influencer, type InsertInfluencer,
  messages, type Message, type InsertMessage,
  bookings, type Booking, type InsertBooking,
  transactions, type Transaction, type InsertTransaction,
  contentPosts, type ContentPost, type InsertContentPost,
  contentPurchases, type ContentPurchase, type InsertContentPurchase 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { db } from "./db";
import { eq, and, or, asc } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWalletBalance(id: number, amount: number): Promise<User | undefined>;
  
  // Influencer operations
  getInfluencer(id: number): Promise<Influencer | undefined>;
  getInfluencerByUsername(username: string): Promise<Influencer | undefined>;
  getInfluencerByHandle(handle: string): Promise<Influencer | undefined>;
  createInfluencer(influencer: InsertInfluencer): Promise<Influencer>;
  getAllInfluencers(): Promise<Influencer[]>;
  updateInfluencerStatus(id: number, isOnline: boolean): Promise<Influencer | undefined>;
  updateInfluencerWalletBalance(id: number, amount: number): Promise<Influencer | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: number, influencerId: number): Promise<Message[]>;
  getMessagesByInfluencer(influencerId: number): Promise<Message[]>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getBookingsByInfluencer(influencerId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getInfluencerTransactions(influencerId: number): Promise<Transaction[]>;
  
  // Content operations
  createContentPost(post: InsertContentPost): Promise<ContentPost>;
  getContentPostsByInfluencer(influencerId: number): Promise<ContentPost[]>;
  getContentPost(id: number): Promise<ContentPost | undefined>;
  
  // Content purchase operations
  createContentPurchase(purchase: InsertContentPurchase): Promise<ContentPurchase>;
  getUserPurchases(userId: number): Promise<ContentPurchase[]>;
  getContentPurchases(contentId: number): Promise<ContentPurchase[]>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private influencers: Map<number, Influencer>;
  private messages: Map<number, Message>;
  private bookings: Map<number, Booking>;
  private transactions: Map<number, Transaction>;
  private contentPosts: Map<number, ContentPost>;
  private contentPurchases: Map<number, ContentPurchase>;
  private currentIds: {
    users: number;
    influencers: number;
    messages: number;
    bookings: number;
    transactions: number;
    contentPosts: number;
    contentPurchases: number;
  };
  
  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.influencers = new Map();
    this.messages = new Map();
    this.bookings = new Map();
    this.transactions = new Map();
    this.contentPosts = new Map();
    this.contentPurchases = new Map();
    
    this.currentIds = {
      users: 1,
      influencers: 1,
      messages: 1,
      bookings: 1,
      transactions: 1,
      contentPosts: 1,
      contentPurchases: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Add demo influencer for development
    this.createInfluencer({
      username: "sophia_martinez",
      password: "hashedpassword123",
      fullName: "Sophia Martinez",
      email: "sophia@example.com",
      bio: "Lifestyle influencer, travel enthusiast, and fitness coach. Let's chat about wellness, travel tips, or your next workout routine!",
      handle: "sophia.martinez",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      messageCost: 20,
      audioCost: 150,
      videoCost: 250
    });
    
    // Add demo content posts
    this.createContentPost({
      influencerId: 1,
      title: "My 30-Day Ab Challenge Guide",
      description: "Complete workout plan with nutrition tips and daily exercises.",
      mediaUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      price: 150
    });
    
    this.createContentPost({
      influencerId: 1,
      title: "Weekly Meal Prep Blueprint",
      description: "Save time and eat healthy with my easy-to-follow meal plans.",
      mediaUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
      price: 120
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      walletBalance: 0,
      createdAt: now,
      profilePicture: insertUser.profilePicture || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserWalletBalance(id: number, amount: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    user.walletBalance = amount;
    this.users.set(id, user);
    return user;
  }
  
  // Influencer operations
  async getInfluencer(id: number): Promise<Influencer | undefined> {
    return this.influencers.get(id);
  }
  
  async getInfluencerByUsername(username: string): Promise<Influencer | undefined> {
    return Array.from(this.influencers.values()).find(
      (influencer) => influencer.username === username,
    );
  }
  
  async getInfluencerByHandle(handle: string): Promise<Influencer | undefined> {
    return Array.from(this.influencers.values()).find(
      (influencer) => influencer.handle === handle,
    );
  }
  
  async createInfluencer(insertInfluencer: InsertInfluencer): Promise<Influencer> {
    const id = this.currentIds.influencers++;
    const now = new Date();
    const influencer: Influencer = { 
      ...insertInfluencer, 
      id, 
      isVerified: false,
      isOnline: false,
      walletBalance: 0,
      createdAt: now,
      profilePicture: insertInfluencer.profilePicture || null,
      bio: insertInfluencer.bio || null,
      messageCost: insertInfluencer.messageCost || 0,
      audioCost: insertInfluencer.audioCost || 0,
      videoCost: insertInfluencer.videoCost || 0
    };
    this.influencers.set(id, influencer);
    return influencer;
  }
  
  async getAllInfluencers(): Promise<Influencer[]> {
    return Array.from(this.influencers.values());
  }
  
  async updateInfluencerStatus(id: number, isOnline: boolean): Promise<Influencer | undefined> {
    const influencer = this.influencers.get(id);
    if (!influencer) return undefined;
    
    influencer.isOnline = isOnline;
    this.influencers.set(id, influencer);
    return influencer;
  }
  
  async updateInfluencerWalletBalance(id: number, amount: number): Promise<Influencer | undefined> {
    const influencer = this.influencers.get(id);
    if (!influencer) return undefined;
    
    influencer.walletBalance = amount;
    this.influencers.set(id, influencer);
    return influencer;
  }
  
  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentIds.messages++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      sentAt: now,
      timestamp: now
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesByUser(userId: number, influencerId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.userId === userId && message.influencerId === influencerId)
    ).sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  }
  
  async getMessagesByInfluencer(influencerId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.influencerId === influencerId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }
  
  // Booking operations
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.currentIds.bookings++;
    const now = new Date();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      status: "pending",
      createdAt: now
    };
    this.bookings.set(id, booking);
    return booking;
  }
  
  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter((booking) => booking.userId === userId)
      .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime());
  }
  
  async getBookingsByInfluencer(influencerId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter((booking) => booking.influencerId === influencerId)
      .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime());
  }
  
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    booking.status = status;
    this.bookings.set(id, booking);
    return booking;
  }
  
  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentIds.transactions++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now,
      userId: insertTransaction.userId ?? null,
      influencerId: insertTransaction.influencerId ?? null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getInfluencerTransactions(influencerId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((transaction) => transaction.influencerId === influencerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Content operations
  async createContentPost(insertPost: InsertContentPost): Promise<ContentPost> {
    const id = this.currentIds.contentPosts++;
    const now = new Date();
    const post: ContentPost = { 
      id, 
      createdAt: now,
      influencerId: insertPost.influencerId,
      title: insertPost.title,
      description: insertPost.description || null,
      contentType: insertPost.contentType || "text",
      mediaUrl: insertPost.mediaUrl || null,
      previewUrl: insertPost.previewUrl || null,
      contentUrl: insertPost.contentUrl || null,
      price: insertPost.price
    };
    this.contentPosts.set(id, post);
    return post;
  }
  
  async getContentPostsByInfluencer(influencerId: number): Promise<ContentPost[]> {
    return Array.from(this.contentPosts.values())
      .filter((post) => post.influencerId === influencerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getContentPost(id: number): Promise<ContentPost | undefined> {
    return this.contentPosts.get(id);
  }
  
  // Content purchase operations
  async createContentPurchase(insertPurchase: InsertContentPurchase): Promise<ContentPurchase> {
    const id = this.currentIds.contentPurchases++;
    const now = new Date();
    const purchase: ContentPurchase = { 
      ...insertPurchase, 
      id, 
      purchasedAt: now
    };
    this.contentPurchases.set(id, purchase);
    return purchase;
  }
  
  async getUserPurchases(userId: number): Promise<ContentPurchase[]> {
    return Array.from(this.contentPurchases.values())
      .filter((purchase) => purchase.userId === userId)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }
  
  async getContentPurchases(contentId: number): Promise<ContentPurchase[]> {
    return Array.from(this.contentPurchases.values())
      .filter((purchase) => purchase.contentId === contentId)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Use PostgreSQL for session storage
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserWalletBalance(id: number, amount: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ walletBalance: amount })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getInfluencer(id: number): Promise<Influencer | undefined> {
    const [influencer] = await db.select().from(influencers).where(eq(influencers.id, id));
    return influencer;
  }

  async getInfluencerByUsername(username: string): Promise<Influencer | undefined> {
    const [influencer] = await db.select().from(influencers).where(eq(influencers.username, username));
    return influencer;
  }

  async getInfluencerByHandle(handle: string): Promise<Influencer | undefined> {
    const [influencer] = await db.select().from(influencers).where(eq(influencers.handle, handle));
    return influencer;
  }

  async createInfluencer(insertInfluencer: InsertInfluencer): Promise<Influencer> {
    const [influencer] = await db.insert(influencers).values(insertInfluencer).returning();
    return influencer;
  }

  async getAllInfluencers(): Promise<Influencer[]> {
    return await db.select().from(influencers);
  }

  async updateInfluencerStatus(id: number, isOnline: boolean): Promise<Influencer | undefined> {
    const [influencer] = await db
      .update(influencers)
      .set({ isOnline })
      .where(eq(influencers.id, id))
      .returning();
    return influencer;
  }

  async updateInfluencerWalletBalance(id: number, amount: number): Promise<Influencer | undefined> {
    const [influencer] = await db
      .update(influencers)
      .set({ walletBalance: amount })
      .where(eq(influencers.id, id))
      .returning();
    return influencer;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    // Ensure timestamp is set to the same value as sentAt
    const now = new Date();
    const messageWithTimestamp = {
      ...insertMessage,
      timestamp: now
    };
    const [message] = await db.insert(messages).values(messageWithTimestamp).returning();
    return message;
  }

  async getMessagesByUser(userId: number, influencerId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.influencerId, influencerId)
        )
      )
      .orderBy(asc(messages.sentAt));
  }
  
  async getMessagesByInfluencer(influencerId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.influencerId, influencerId))
      .orderBy(asc(messages.sentAt));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingsByInfluencer(influencerId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.influencerId, influencerId));
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getInfluencerTransactions(influencerId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.influencerId, influencerId));
  }

  async createContentPost(insertPost: InsertContentPost): Promise<ContentPost> {
    const [post] = await db.insert(contentPosts).values(insertPost).returning();
    return post;
  }

  async getContentPostsByInfluencer(influencerId: number): Promise<ContentPost[]> {
    return await db.select().from(contentPosts).where(eq(contentPosts.influencerId, influencerId));
  }

  async getContentPost(id: number): Promise<ContentPost | undefined> {
    const [post] = await db.select().from(contentPosts).where(eq(contentPosts.id, id));
    return post;
  }

  async createContentPurchase(insertPurchase: InsertContentPurchase): Promise<ContentPurchase> {
    const [purchase] = await db.insert(contentPurchases).values(insertPurchase).returning();
    return purchase;
  }

  async getUserPurchases(userId: number): Promise<ContentPurchase[]> {
    return await db.select().from(contentPurchases).where(eq(contentPurchases.userId, userId));
  }
  
  async getContentPurchases(contentId: number): Promise<ContentPurchase[]> {
    return await db.select().from(contentPurchases).where(eq(contentPurchases.contentId, contentId));
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
