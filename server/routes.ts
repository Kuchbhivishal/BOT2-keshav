import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupWebsocketServer } from "./websocket";
import { storage } from "./storage";
import { z } from "zod";
import { WebSocketServer } from "ws";
import { 
  insertTransactionSchema, 
  insertBookingSchema, 
  insertContentPurchaseSchema,
  insertContentPostSchema,
  type Message
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  setupWebsocketServer(httpServer);
  
  // Influencer-related routes
  app.get("/api/influencers", async (req, res) => {
    try {
      console.log("Fetching all influencers");
      const influencers = await storage.getAllInfluencers();
      
      // Remove password field from the response
      const influencersWithoutPassword = influencers.map(influencer => {
        const { password, ...rest } = influencer;
        return rest;
      });
      
      console.log(`Found ${influencersWithoutPassword.length} influencers`);
      res.json(influencersWithoutPassword);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/influencers/:handle", async (req, res) => {
    try {
      const handle = req.params.handle;
      const influencer = await storage.getInfluencerByHandle(handle);
      
      if (!influencer) {
        return res.status(404).json({ message: "Influencer not found" });
      }
      
      // Remove password field from the response
      const { password, ...influencerWithoutPassword } = influencer;
      res.json(influencerWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Message-related routes
  app.get("/api/messages/:influencerId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      const influencerId = parseInt(req.params.influencerId);
      
      if (isNaN(influencerId)) {
        return res.status(400).json({ message: "Invalid influencer ID" });
      }
      
      const messages = await storage.getMessagesByUser(user.id, influencerId);
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Wallet-related routes
  app.post("/api/wallet/add-funds", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      const schema = z.object({
        amount: z.number().positive(),
        paymentMethod: z.string()
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      const { amount, paymentMethod } = validation.data;
      
      // Update user's wallet balance
      const currentUser = await storage.getUser(user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newBalance = currentUser.walletBalance + amount;
      await storage.updateUserWalletBalance(user.id, newBalance);
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        influencerId: null,
        amount,
        type: "deposit",
        description: `Added funds via ${paymentMethod}`
      });
      
      res.json({ 
        balance: newBalance,
        transaction
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Booking-related routes
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Validate request body
      const validation = insertBookingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      const bookingData = validation.data;
      
      // Get user and influencer
      const currentUser = await storage.getUser(user.id);
      const influencer = await storage.getInfluencer(bookingData.influencerId);
      
      if (!currentUser || !influencer) {
        return res.status(404).json({ message: "User or influencer not found" });
      }
      
      // Calculate total cost
      const hourlyRate = bookingData.callType === "audio" 
        ? influencer.audioCost 
        : influencer.videoCost;
      
      const totalCost = hourlyRate * (bookingData.durationMinutes / 60);
      
      // Check if user has sufficient balance
      if (currentUser.walletBalance < totalCost) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      
      // Create booking
      const booking = await storage.createBooking({
        ...bookingData,
        userId: user.id,
        totalCost
      });
      
      // Deduct amount from user's wallet
      const newBalance = currentUser.walletBalance - totalCost;
      await storage.updateUserWalletBalance(user.id, newBalance);
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        influencerId: bookingData.influencerId,
        amount: -totalCost,
        type: bookingData.callType,
        description: `Booked ${bookingData.callType} call with ${influencer.fullName} for ${bookingData.durationMinutes} minutes`
      });
      
      res.status(201).json({ 
        booking,
        balance: newBalance
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      const bookings = await storage.getBookingsByUser(user.id);
      res.json(bookings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/bookings/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const bookingId = parseInt(req.params.id);
      
      if (isNaN(bookingId)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      const schema = z.object({
        status: z.enum(["pending", "confirmed", "completed", "cancelled"])
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const { status } = validation.data;
      
      const updatedBooking = await storage.updateBookingStatus(bookingId, status);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(updatedBooking);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Influencer-specific routes
  app.get("/api/influencer/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      console.log(`Checking if user ${user.username} is an influencer`);
      
      // Try to find influencer with matching username
      const influencer = await storage.getInfluencerByUsername(user.username);
      
      if (!influencer) {
        console.log(`User ${user.username} is not an influencer`);
        return res.status(404).json({ message: "You are not registered as an influencer" });
      }
      
      // Remove password field from the response
      const { password, ...influencerWithoutPassword } = influencer;
      console.log(`Found influencer profile for ${influencer.username}`);
      res.json(influencerWithoutPassword);
    } catch (error) {
      console.error("Error checking influencer status:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get messages for influencer
  app.get("/api/influencer/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Check if user is an influencer
      const influencer = await storage.getInfluencerByUsername(user.username);
      if (!influencer) {
        return res.status(403).json({ message: "Only influencers can access this endpoint" });
      }
      
      const messages = await storage.getMessagesByInfluencer(influencer.id);
      
      // Group messages by user
      const messagesByUser: Record<number, Message[]> = {};
      
      messages.forEach(message => {
        if (!messagesByUser[message.userId]) {
          messagesByUser[message.userId] = [];
        }
        messagesByUser[message.userId].push(message);
      });
      
      // Get user details for each conversation
      const conversationsWithUserInfo = await Promise.all(
        Object.entries(messagesByUser).map(async ([userId, messages]) => {
          const user = await storage.getUser(parseInt(userId));
          return {
            userId: parseInt(userId),
            userName: user?.username || "Unknown user",
            userProfilePic: user?.profilePicture || null,
            messages: messages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime()),
            lastMessageAt: messages.reduce((latest, msg) => 
              msg.sentAt.getTime() > latest.getTime() ? msg.sentAt : latest, 
              new Date(0))
          };
        })
      );
      
      // Sort conversations by most recent message
      const sortedConversations = conversationsWithUserInfo.sort(
        (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
      );
      
      res.json(sortedConversations);
    } catch (error) {
      console.error("Error fetching influencer messages:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get bookings for influencer
  app.get("/api/influencer/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Check if user is an influencer
      const influencer = await storage.getInfluencerByUsername(user.username);
      if (!influencer) {
        return res.status(403).json({ message: "Only influencers can access this endpoint" });
      }
      
      const bookings = await storage.getBookingsByInfluencer(influencer.id);
      
      // Get user details for each booking
      const bookingsWithUserInfo = await Promise.all(
        bookings.map(async (booking) => {
          const user = await storage.getUser(booking.userId);
          return {
            ...booking,
            userName: user?.username || "Unknown user",
            userProfilePic: user?.profilePicture || null
          };
        })
      );
      
      res.json(bookingsWithUserInfo);
    } catch (error) {
      console.error("Error fetching influencer bookings:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get content stats for influencer
  app.get("/api/influencer/content", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Check if user is an influencer
      const influencer = await storage.getInfluencerByUsername(user.username);
      if (!influencer) {
        return res.status(403).json({ message: "Only influencers can access this endpoint" });
      }
      
      const contentPosts = await storage.getContentPostsByInfluencer(influencer.id);
      
      // Get purchase stats for each content post
      const contentWithStats = await Promise.all(
        contentPosts.map(async (post) => {
          const purchases = await storage.getContentPurchases(post.id);
          
          return {
            ...post,
            purchaseCount: purchases.length,
            revenue: purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0),
            recentPurchases: purchases.slice(0, 5).map(purchase => ({
              ...purchase,
              date: purchase.purchasedAt
            }))
          };
        })
      );
      
      res.json(contentWithStats);
    } catch (error) {
      console.error("Error fetching influencer content stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Register current user as an influencer
  app.post("/api/become-influencer", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Check if user is already an influencer
      const existingInfluencer = await storage.getInfluencerByUsername(user.username);
      if (existingInfluencer) {
        return res.status(400).json({ message: "You are already registered as an influencer" });
      }
      
      // Create influencer profile
      const newInfluencer = await storage.createInfluencer({
        username: user.username,
        password: user.password, // Use same password as user account
        fullName: user.fullName || user.username,
        email: user.email || "",
        profilePicture: user.profilePicture || "",
        bio: req.body.bio || "New influencer on the platform",
        handle: req.body.handle || user.username.toLowerCase(),
        videoCost: req.body.videoCost || 100,
        audioCost: req.body.audioCost || 50,
        messageCost: req.body.messageCost || 5
      });
      
      // Return the new influencer profile without password
      const { password, ...influencerWithoutPassword } = newInfluencer;
      res.status(201).json(influencerWithoutPassword);
    } catch (error) {
      console.error("Error registering as influencer:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create new content post
  app.post("/api/influencer/content", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Check if user is an influencer
      const influencer = await storage.getInfluencerByUsername(user.username);
      if (!influencer) {
        return res.status(403).json({ message: "Only influencers can create content" });
      }
      
      // Validate request body
      const validation = insertContentPostSchema.safeParse({
        ...req.body,
        influencerId: influencer.id
      });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid input", errors: validation.error.errors });
      }
      
      const contentData = validation.data;
      const newContent = await storage.createContentPost(contentData);
      
      res.status(201).json(newContent);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Content-related routes
  app.get("/api/content/:influencerId", async (req, res) => {
    try {
      const influencerId = parseInt(req.params.influencerId);
      
      if (isNaN(influencerId)) {
        return res.status(400).json({ message: "Invalid influencer ID" });
      }
      
      const contentPosts = await storage.getContentPostsByInfluencer(influencerId);
      res.json(contentPosts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/content/purchase", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      
      // Validate request body
      const validation = insertContentPurchaseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      const purchaseData = validation.data;
      
      // Get user and content post
      const currentUser = await storage.getUser(user.id);
      const contentPost = await storage.getContentPost(purchaseData.contentId);
      
      if (!currentUser || !contentPost) {
        return res.status(404).json({ message: "User or content not found" });
      }
      
      // Check if user has sufficient balance
      if (currentUser.walletBalance < contentPost.price) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      
      // Create purchase record
      const purchase = await storage.createContentPurchase({
        userId: user.id,
        contentId: purchaseData.contentId,
        paidAmount: contentPost.price
      });
      
      // Deduct amount from user's wallet
      const newBalance = currentUser.walletBalance - contentPost.price;
      await storage.updateUserWalletBalance(user.id, newBalance);
      
      // Add amount to influencer's wallet
      const influencer = await storage.getInfluencer(contentPost.influencerId);
      if (influencer) {
        const newInfluencerBalance = influencer.walletBalance + contentPost.price;
        await storage.updateInfluencerWalletBalance(influencer.id, newInfluencerBalance);
      }
      
      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        influencerId: contentPost.influencerId,
        amount: -contentPost.price,
        type: "content",
        description: `Purchased content: ${contentPost.title}`
      });
      
      res.status(201).json({ 
        purchase,
        balance: newBalance,
        content: contentPost
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/content/purchases", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = req.user as Express.User;
      const purchases = await storage.getUserPurchases(user.id);
      
      // Get content details for each purchase
      const purchasesWithContent = await Promise.all(
        purchases.map(async (purchase) => {
          const content = await storage.getContentPost(purchase.contentId);
          return {
            ...purchase,
            content
          };
        })
      );
      
      res.json(purchasesWithContent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
