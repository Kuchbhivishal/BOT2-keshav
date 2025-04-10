import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create test user
    const testUser = await storage.createUser({
      username: "testuser",
      password: await hashPassword("password123"),
      fullName: "Test User",
      email: "test@example.com",
      profilePicture: null,
      walletBalance: 1000 // Start with 1000 balance for testing
    });
    
    console.log(`Created test user with ID ${testUser.id}`);

    // Create influencers
    const influencers = [
      {
        username: "fashion_emma",
        password: await hashPassword("influencer123"),
        handle: "emma",
        fullName: "Emma Style",
        email: "emma@example.com",
        bio: "Fashion and lifestyle influencer. I love sharing my daily outfits and style tips!",
        profilePicture: "https://randomuser.me/api/portraits/women/44.jpg",
        coverPicture: null,
        isVerified: true,
        isOnline: true,
        messageCost: 5,
        audioCost: 10,
        videoCost: 20,
        walletBalance: 500,
        category: "fashion"
      },
      {
        username: "tech_jason",
        password: await hashPassword("influencer123"),
        handle: "jason",
        fullName: "Jason Tech",
        email: "jason@example.com",
        bio: "Tech enthusiast and gadget reviewer. Let's talk about the latest in technology!",
        profilePicture: "https://randomuser.me/api/portraits/men/32.jpg",
        coverPicture: null,
        isVerified: true,
        isOnline: false,
        messageCost: 3,
        audioCost: 15,
        videoCost: 25,
        walletBalance: 300,
        category: "tech"
      },
      {
        username: "fitness_alex",
        password: await hashPassword("influencer123"),
        handle: "alex",
        fullName: "Alex Fitness",
        email: "alex@example.com",
        bio: "Personal trainer and fitness coach. I'll help you achieve your fitness goals!",
        profilePicture: "https://randomuser.me/api/portraits/women/66.jpg",
        coverPicture: null,
        isVerified: true,
        isOnline: true,
        messageCost: 4,
        audioCost: 12,
        videoCost: 18,
        walletBalance: 450,
        category: "fitness"
      }
    ];

    for (const influencerData of influencers) {
      const influencer = await storage.createInfluencer(influencerData);
      console.log(`Created influencer ${influencer.fullName} with ID ${influencer.id}`);

      // Create some content posts for each influencer
      const contentPosts = [
        {
          influencerId: influencer.id,
          title: `Exclusive ${influencer.category} Tips`,
          description: `Get my exclusive ${influencer.category} tips that I don't share anywhere else.`,
          contentUrl: `https://example.com/content/${influencer.handle}/tips`,
          previewUrl: `https://source.unsplash.com/random/300x200?${influencer.category}`,
          contentType: "text",
          price: 15
        },
        {
          influencerId: influencer.id,
          title: `Premium ${influencer.category} Photos`,
          description: `Check out my premium ${influencer.category} photoshoot that's exclusive to my subscribers.`,
          contentUrl: `https://example.com/content/${influencer.handle}/photos`,
          previewUrl: `https://source.unsplash.com/random/300x200?${influencer.category},studio`,
          contentType: "image",
          price: 25
        },
        {
          influencerId: influencer.id,
          title: `Behind the Scenes Video`,
          description: `Get a glimpse behind the scenes of what I do in this exclusive video.`,
          contentUrl: `https://example.com/content/${influencer.handle}/video`,
          previewUrl: `https://source.unsplash.com/random/300x200?${influencer.category},video`,
          contentType: "video",
          price: 35
        }
      ];

      for (const postData of contentPosts) {
        const post = await storage.createContentPost(postData);
        console.log(`Created content post "${post.title}" with ID ${post.id}`);
      }
    }

    // Create some sample messages between test user and first influencer
    const firstInfluencer = await storage.getInfluencerByHandle("emma");
    if (firstInfluencer) {
      const messages = [
        {
          senderId: testUser.id,
          receiverId: firstInfluencer.id,
          senderType: "user",
          content: "Hi Emma! I love your fashion tips. Can you recommend a summer outfit?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
        },
        {
          senderId: firstInfluencer.id,
          receiverId: testUser.id,
          senderType: "influencer",
          content: "Hey there! Thanks for reaching out. For summer, I'd recommend light cotton dresses or linen shorts with a breathable top. What's your usual style?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5) // 1.5 hours ago
        },
        {
          senderId: testUser.id,
          receiverId: firstInfluencer.id,
          senderType: "user",
          content: "I usually go for casual looks. Do you have any specific brand recommendations?",
          timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        }
      ];

      for (const messageData of messages) {
        const message = await storage.createMessage(messageData);
        console.log(`Created message with ID ${message.id}`);

        // Add transactions for user messages
        if (messageData.senderType === "user") {
          // Deduct amount from user wallet
          const updatedUser = await storage.updateUserWalletBalance(
            testUser.id, 
            testUser.walletBalance - firstInfluencer.messageCost
          );
          
          // Add transaction record
          await storage.createTransaction({
            userId: testUser.id,
            influencerId: firstInfluencer.id,
            amount: -firstInfluencer.messageCost,
            type: "message",
            description: `Message to ${firstInfluencer.fullName}`
          });
          
          console.log(`Created transaction for message`);
        }
      }
    }

    // Create a sample booking
    const secondInfluencer = await storage.getInfluencerByHandle("jason");
    if (secondInfluencer) {
      const booking = await storage.createBooking({
        userId: testUser.id,
        influencerId: secondInfluencer.id,
        callType: "video",
        durationMinutes: 15,
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
        status: "confirmed",
        totalCost: secondInfluencer.videoCost * 15
      });
      
      console.log(`Created booking with ID ${booking.id}`);
      
      // Add transaction record
      await storage.createTransaction({
        userId: testUser.id,
        influencerId: secondInfluencer.id,
        amount: -(secondInfluencer.videoCost * 15),
        type: "video",
        description: `Scheduled video call with ${secondInfluencer.fullName} for 15 minutes`
      });
      
      // Update user wallet balance
      await storage.updateUserWalletBalance(
        testUser.id, 
        testUser.walletBalance - (secondInfluencer.videoCost * 15)
      );
      
      console.log(`Created transaction for booking`);
    }

    // Create a sample content purchase
    const thirdInfluencer = await storage.getInfluencerByHandle("alex");
    if (thirdInfluencer) {
      const contentPosts = await storage.getContentPostsByInfluencer(thirdInfluencer.id);
      
      if (contentPosts.length > 0) {
        const contentPost = contentPosts[0];
        
        const purchase = await storage.createContentPurchase({
          userId: testUser.id,
          contentId: contentPost.id,
          paidAmount: contentPost.price
        });
        
        console.log(`Created content purchase with ID ${purchase.id}`);
        
        // Add transaction record
        await storage.createTransaction({
          userId: testUser.id,
          influencerId: thirdInfluencer.id,
          amount: -contentPost.price,
          type: "content",
          description: `Purchased content: ${contentPost.title}`
        });
        
        // Update user wallet balance
        await storage.updateUserWalletBalance(
          testUser.id, 
          testUser.walletBalance - contentPost.price
        );
        
        console.log(`Created transaction for content purchase`);
      }
    }

    // Add a wallet deposit transaction
    await storage.createTransaction({
      userId: testUser.id,
      influencerId: null,
      amount: 1000,
      type: "deposit",
      description: "Initial wallet deposit"
    });
    
    console.log("Added deposit transaction");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run the seed function
seedDatabase();