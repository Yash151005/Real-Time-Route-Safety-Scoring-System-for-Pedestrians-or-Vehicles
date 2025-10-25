import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Simple user authentication without external auth providers
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer_not_to_say")),
    age: v.number(),
    modeOfTransport: v.union(v.literal("walking"), v.literal("cycling"), v.literal("car"), v.literal("public_transport")),
    emergencyContact: v.string(),
    preferences: v.object({
      avoidDarkAreas: v.boolean(),
      preferWellLitRoutes: v.boolean(),
      avoidHighCrimeAreas: v.boolean(),
      preferMainRoads: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      throw new ConvexError("User with this email already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password, // In production, hash this password
      fullName: args.fullName,
      gender: args.gender,
      age: args.age,
      modeOfTransport: args.modeOfTransport,
      emergencyContact: args.emergencyContact,
      preferences: args.preferences,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { userId, success: true };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    if (user.password !== args.password) {
      throw new ConvexError("Invalid email or password");
    }

    return { userId: user._id, success: true };
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // For now, return null - in a real app, you'd get this from session/token
    return null;
  },
});

