// Simple script to seed the database with sample data
// Run with: node scripts/seed-data.js

import { scrypt } from 'crypto';
import { promisify } from 'util';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon to use the ws package
neonConfig.webSocketConstructor = ws;

const scryptAsync = promisify(scrypt);

// Hash password function
async function hashPassword(password) {
  const salt = 'sample_salt';
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Create a test user
    const hashedPassword = await hashPassword('password123');
    
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['testuser']);
    
    if (userCheck.rows.length === 0) {
      // Insert test user
      await pool.query(`
        INSERT INTO users (username, password, email, full_name, profile_picture, wallet_balance, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'testuser',
        hashedPassword,
        'test@example.com',
        'Test User',
        'https://i.pravatar.cc/150?u=testuser',
        1000, // Initial wallet balance
        new Date()
      ]);
      
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }
    
    // Create sample influencers
    const influencerData = [
      {
        username: 'fitness_guru',
        password: hashedPassword,
        email: 'fitness@example.com',
        fullName: 'Fitness Guru',
        handle: 'fitnessguru',
        bio: 'Personal trainer and fitness expert with over 10 years of experience. Specializing in home workouts and nutrition guidance.',
        profilePicture: 'https://i.pravatar.cc/150?u=fitness',
        isVerified: true,
        messageCost: 10,
        audioCost: 50,
        videoCost: 100,
        isOnline: true,
        walletBalance: 5000,
        categories: ['Fitness', 'Health', 'Nutrition']
      },
      {
        username: 'tech_expert',
        password: hashedPassword,
        email: 'tech@example.com',
        fullName: 'Tech Expert',
        handle: 'techexpert',
        bio: 'Technology reviewer and gadget enthusiast. I provide insights on latest tech trends and product reviews.',
        profilePicture: 'https://i.pravatar.cc/150?u=tech',
        isVerified: true,
        messageCost: 15,
        audioCost: 60,
        videoCost: 120,
        isOnline: false,
        walletBalance: 3000,
        categories: ['Technology', 'Gadgets', 'Reviews']
      },
      {
        username: 'fashion_stylist',
        password: hashedPassword,
        email: 'fashion@example.com',
        fullName: 'Fashion Stylist',
        handle: 'fashionstylist',
        bio: 'Fashion expert helping you look your best. Get personalized style advice and wardrobe tips.',
        profilePicture: 'https://i.pravatar.cc/150?u=fashion',
        isVerified: true,
        messageCost: 20,
        audioCost: 70,
        videoCost: 150,
        isOnline: true,
        walletBalance: 7000,
        categories: ['Fashion', 'Beauty', 'Lifestyle']
      }
    ];
    
    for (const influencer of influencerData) {
      // Check if influencer exists
      const influencerCheck = await pool.query('SELECT * FROM influencers WHERE username = $1', [influencer.username]);
      
      if (influencerCheck.rows.length === 0) {
        // Insert influencer
        await pool.query(`
          INSERT INTO influencers (
            username, password, email, full_name, handle, bio, profile_picture,
            is_verified, message_cost, audio_cost, video_cost, is_online, wallet_balance, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          influencer.username,
          influencer.password,
          influencer.email,
          influencer.fullName,
          influencer.handle,
          influencer.bio,
          influencer.profilePicture,
          influencer.isVerified,
          influencer.messageCost,
          influencer.audioCost,
          influencer.videoCost,
          influencer.isOnline,
          influencer.walletBalance,
          new Date()
        ]);
        
        console.log(`Influencer ${influencer.username} created successfully`);
      } else {
        console.log(`Influencer ${influencer.username} already exists`);
      }
      
      // Add content posts for the influencer
      const influencerId = (await pool.query('SELECT id FROM influencers WHERE username = $1', [influencer.username])).rows[0].id;
      
      // Sample content posts
      const contentPosts = [
        {
          title: 'Premium Masterclass',
          description: 'Exclusive content with in-depth tutorial',
          mediaUrl: `https://picsum.photos/seed/${influencer.username}1/800/600`,
          price: 50,
          influencerId,
          createdAt: new Date()
        },
        {
          title: 'Behind The Scenes',
          description: 'Get access to my personal workspace and methods',
          mediaUrl: `https://picsum.photos/seed/${influencer.username}2/800/600`,
          price: 30,
          influencerId,
          createdAt: new Date()
        }
      ];
      
      for (const post of contentPosts) {
        // Check if content exists
        const contentCheck = await pool.query(
          'SELECT * FROM content_posts WHERE title = $1 AND influencer_id = $2', 
          [post.title, post.influencerId]
        );
        
        if (contentCheck.rows.length === 0) {
          // Insert content post
          await pool.query(`
            INSERT INTO content_posts (
              title, description, media_url, price, influencer_id, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            post.title,
            post.description,
            post.mediaUrl,
            post.price,
            post.influencerId,
            post.createdAt
          ]);
          
          console.log(`Content post "${post.title}" created for ${influencer.username}`);
        } else {
          console.log(`Content post "${post.title}" already exists for ${influencer.username}`);
        }
      }
    }
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();