import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveRouteHistory = mutation({
  args: {
    userId: v.id("users"),
    startLocation: v.string(),
    endLocation: v.string(),
    routeData: v.object({
      coordinates: v.array(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
      safetyScore: v.number(),
      distance: v.number(),
      duration: v.number(),
      explanation: v.optional(v.object({
        weather_impact: v.number(),
        accident_impact: v.number(),
      })),
    }),
    timeOfDay: v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening"), v.literal("night")),
    dayOfWeek: v.union(v.literal("monday"), v.literal("tuesday"), v.literal("wednesday"), v.literal("thursday"), v.literal("friday"), v.literal("saturday"), v.literal("sunday")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("routeHistory", {
      ...args,
      timestamp: now,
    });
  },
});

export const getUserRouteHistory = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    return await ctx.db
      .query("routeHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const getCurrentUserRouteHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const limit = args.limit || 10;
    
    return await ctx.db
      .query("routeHistory")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject as any))
      .order("desc")
      .take(limit);
  },
});

