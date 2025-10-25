import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  users: defineTable({
    email: v.optional(v.string()),
    password: v.optional(v.string()),
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
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).index("by_email", ["email"]),
  
  userProfiles: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
  
  routeHistory: defineTable({
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
    timestamp: v.number(),
    timeOfDay: v.union(v.literal("morning"), v.literal("afternoon"), v.literal("evening"), v.literal("night")),
    dayOfWeek: v.union(v.literal("monday"), v.literal("tuesday"), v.literal("wednesday"), v.literal("thursday"), v.literal("friday"), v.literal("saturday"), v.literal("sunday")),
  }).index("by_userId", ["userId"]).index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
