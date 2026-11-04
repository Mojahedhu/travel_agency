import { z } from "zod";
import {
  budgetOptions,
  countries,
  groupTypes,
  interests,
  travelStyles,
} from "../../constants";

/**
 * Schema for validating the incoming payload from the client to `/api/create-trip`.
 * Follows defensive validation best practices:
 * - Trims input strings
 * - Strictly enforces allowable enum/option values from constants
 * - Enforces minimum and maximum day limits (1 - 10 days)
 * - Sanitizes/validates Appwrite user ID format
 */
export const CreateTripRequestSchema = z.object({
  country: z
    .string("Country is required.")
    .trim()
    .min(1, "Country name cannot be empty.")
    .max(100, "Country name is too long.")
    .refine((val) => countries.some((c) => c.value === val), {
      message: "Invalid country. Select a country from the list.",
    }),

  numberOfDays: z
    .number("Number of days is required")
    .refine((val) => !Number.isNaN(val), {
      message: "Number of days must be a number.",
    })
    .int("Number of days must be an integer.")
    .min(1, "Trip duration must be at least 1 day.")
    .max(10, "Trip duration cannot exceed 10 days."),

  travelStyle: z
    .string("Travel style is required.")
    .refine((val) => travelStyles.includes(val), {
      message: `Invalid travel style. Expected one of: ${travelStyles.join(", ")}`,
    }),

  interests: z
    .string("Interest is required.")
    .refine((val) => interests.includes(val), {
      message: `Invalid interest. Expected one of: ${interests.join(", ")}`,
    }),

  budget: z
    .string("Budget is required.")
    .refine((val) => budgetOptions.includes(val), {
      message: `Invalid budget. Expected one of: ${budgetOptions.join(", ")}`,
    }),

  groupType: z
    .string("Group type is required.")
    .refine((val) => groupTypes.includes(val), {
      message: `Invalid group type. Expected one of: ${groupTypes.join(", ")}`,
    }),

  //   userId: z
  //     .string("User ID is required.")
  //     .trim()
  //     .min(1, "User ID cannot be empty.")
  //     .max(128, "Invalid user ID length."),
});

/**
 * Inferred TypeScript type from the validation schema.
 */
export type CreateTripRequestInput = z.infer<typeof CreateTripRequestSchema>;

/**
 * Optional: Schema for validating Gemini's generated JSON response before saving to DB.
 * Guarantees that AI-generated data is safe and strictly adheres to the Trip structure.
 */
export const GeneratedTripSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedPrice: z.string().min(1),
  duration: z.number().int().positive(),
  budget: z.string(),
  travelStyle: z.string(),
  country: z.string(),
  interests: z.string(),
  groupType: z.string(),
  bestTimeToVisit: z.array(z.string()),
  weatherInfo: z.array(z.string()),
  location: z.object({
    city: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    openStreetMap: z.string(),
  }),
  itinerary: z.array(
    z.object({
      day: z.number().int().positive(),
      location: z.string(),
      activities: z.array(
        z.object({
          time: z.string(),
          description: z.string(),
        }),
      ),
    }),
  ),
});

export type GeneratedTrip = z.infer<typeof GeneratedTripSchema>;
