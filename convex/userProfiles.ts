import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUserProfile = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject as any))
      .first();

    if (existingProfile) {
      // Update existing profile
      const now = Date.now();
      return await ctx.db.patch(existingProfile._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      // Create new profile
      const now = Date.now();
      return await ctx.db.insert("userProfiles", {
        userId: identity.subject as any,
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer_not_to_say"))),
    age: v.optional(v.number()),
    modeOfTransport: v.optional(v.union(v.literal("walking"), v.literal("cycling"), v.literal("car"), v.literal("public_transport"))),
    emergencyContact: v.optional(v.string()),
    preferences: v.optional(v.object({
      avoidDarkAreas: v.boolean(),
      preferWellLitRoutes: v.boolean(),
      avoidHighCrimeAreas: v.boolean(),
      preferMainRoads: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (!existingProfile) {
      throw new Error("User profile not found");
    }
    
    return await ctx.db.patch(existingProfile._id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject as any))
      .first();
  },
});
