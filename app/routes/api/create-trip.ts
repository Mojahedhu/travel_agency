import { type ActionFunctionArgs, data as res } from "react-router";
import { GoogleGenAI } from "@google/genai";

import { appwriteConfig } from "../../appwrite/client";
import { ID } from "appwrite";
import { createSessionClient } from "../../appwrite/server";
import { CreateTripRequestSchema } from "../../lib/validations/trip";

export const action = async ({ request }: ActionFunctionArgs) => {
  // 1. Verify User on the Server
  const { user, database } = await createSessionClient(request);
  if (!user) {
    return res(
      { error: "Unauthorized: You must be logged in to create a trip." },
      { status: 401 },
    );
  }

  const rawBody = await request.json();
  // 1. Safe parsing with Zod
  const validationResult = CreateTripRequestSchema.safeParse(rawBody);

  if (!validationResult.success) {
    const issues = validationResult.error.issues.map((issue) => ({
      field: issue.path.join(".") || "form",
      message: issue.message,
    }));
    return res(
      {
        error: issues[0]?.message || "Validation Error",
        issues,
      },
      { status: 400 },
    );
  }

  // 2. Type-safe validated data
  const { country, numberOfDays, travelStyle, interests, budget, groupType } =
    validationResult.data;

  // 3. Now safely use user.$id from the verified server session!
  const verifiedUserId = user.$id;

  const { databaseId, tripCollectionId } = appwriteConfig;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY!;

  try {
    const prompt = `Generate a ${numberOfDays}-day travel itinerary for ${country} based on the following user information:
        Budget: '${budget}'
        Interests: '${interests}'
        TravelStyle: '${travelStyle}'
        GroupType: '${groupType}'
        Return the itinerary and lowest estimated price in a clean, non-markdown JSON format with the following structure:
        {
        "name": "A descriptive title for the trip",
        "description": "A brief description of the trip and its highlights not exceeding 100 words",
        "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
        "duration": ${numberOfDays},
        "budget": "${budget}",
        "travelStyle": "${travelStyle}",
        "country": "${country}",
        "interests": ${interests},
        "groupType": "${groupType}",
        "bestTimeToVisit": [
          '🌸 Season (from month to month): reason to visit',
          '☀️ Season (from month to month): reason to visit',
          '🍁 Season (from month to month): reason to visit',
          '❄️ Season (from month to month): reason to visit'
        ],
        "weatherInfo": [
          '☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
          '🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
          '🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
          '❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)'
        ],
        "location": {
          "city": "name of the city or region",
          "coordinates": [latitude, longitude],
          "openStreetMap": "link to open street map"
        },
        "itinerary": [
        {
          "day": 1,
          "location": "City/Region Name",
          "activities": [
            {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
            {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
            {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
          ]
        },
        ...
        ]
    }`;

    const textResult = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const trip = JSON.parse(textResult.text);

    const imageResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(`${country} ${interests} ${travelStyle}`)}&client_id=${unsplashApiKey}`,
    );

    const data = await imageResponse.json();

    const imageUrls = (data.results || [])
      .slice(0, 3)
      .map((result: any) => result.urls?.regular || null);

    const result = await database.createRow({
      databaseId,
      tableId: tripCollectionId,
      rowId: ID.unique(),
      data: {
        tripDetails: JSON.stringify(trip),
        imageUrls,
        userId: verifiedUserId,
      },
    });

    return res({ id: result.$id });
  } catch (e) {
    console.error("Error generating travel plan: ", e);
    return res({ error: "Internal server error" }, { status: 500 });
  }
};
