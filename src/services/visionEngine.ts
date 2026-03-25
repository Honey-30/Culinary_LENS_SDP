/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Ingredient } from "../types";

export class VisionEngine {
  public ai: GoogleGenAI;
  private lastImageHash: string | null = null;
  private lastResult: { ingredients: Ingredient[], humanDetected: boolean } | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async processImage(base64Image: string): Promise<{ ingredients: Ingredient[], humanDetected: boolean }> {
    // Simple caching to minimize API calls for the same image
    const currentHash = base64Image.substring(0, 100) + base64Image.length;
    if (this.lastImageHash === currentHash && this.lastResult) {
      console.log("VisionEngine: Using cached result");
      return this.lastResult;
    }

    // Stage 1: Hugging Face Object Detection
    let hfDetections: any[] = [];
    const hfToken = process.env.HF_API_TOKEN;
    
    if (hfToken) {
      try {
        // Convert base64 to Uint8Array for browser compatibility
        const binaryString = atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const hfResponse = await fetch(
          "https://api-inference.huggingface.co/models/valentina/food-object-detection",
          {
            headers: { Authorization: `Bearer ${hfToken}` },
            method: "POST",
            body: bytes,
          }
        );
        hfDetections = await hfResponse.json();
      } catch (e) {
        console.error("HF Detection failed:", e);
      }
    }

    // Stage 2: Gemini Enrichment
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview", // Switched to Flash for free tier efficiency
      contents: [
        {
          parts: [
            { text: `Analyze this food image. I've detected some items using a Stage-1 detector: ${JSON.stringify(hfDetections)}. 
            Identify every single edible ingredient, fruit, or vegetable visible. 
            
            CRITICAL GUARDRAILS:
            1. DO NOT detect humans, hands, or any body parts as ingredients.
            2. DO NOT detect non-edible items (plates, cutlery, tables, packaging, phones, etc.) as ingredients.
            3. ONLY identify items that are strictly edible food components.
            
            For each edible item, provide its name, category, confidence level, and its approximate center coordinates (x and y) as a percentage of the image width and height (0-100). 
            If an item matches one from the Stage-1 detector, use its bounding box [ymin, xmin, ymax, xmax] if available.
            Also check if any humans are present in the image. 
            Return a JSON object with 'ingredients' (array of objects with name, category, confidence, x, y, boundingBox, aromaticProfile, nutritionalEstimate) and 'humanDetected' (boolean).` },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  x: { type: Type.NUMBER, description: "X coordinate (0-100)" },
                  y: { type: Type.NUMBER, description: "Y coordinate (0-100)" },
                  boundingBox: { 
                    type: Type.ARRAY, 
                    items: { type: Type.NUMBER },
                    description: "[ymin, xmin, ymax, xmax] normalized 0-1000"
                  },
                  aromaticProfile: { type: Type.STRING },
                  nutritionalEstimate: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER }
                    }
                  }
                },
                required: ["name", "category", "confidence", "x", "y"]
              }
            },
            humanDetected: { type: Type.BOOLEAN }
          },
          required: ["ingredients", "humanDetected"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Confidence Cross-Validation & Bounding Box Mapping
    const enrichedIngredients = (result.ingredients || []).map((ing: any, index: number) => {
      // Find matching HF detection
      const hfMatch = hfDetections.find(hf => 
        hf.label.toLowerCase().includes(ing.name.toLowerCase()) || 
        ing.name.toLowerCase().includes(hf.label.toLowerCase())
      );

      let confidence = ing.confidence;
      let boundingBox = ing.boundingBox;

      if (hfMatch) {
        // Simple fusion: average confidence if both are high, or take the higher one
        confidence = (ing.confidence + hfMatch.score) / 2;
        
        // If Gemini didn't provide a bounding box but HF did, use HF's
        if (!boundingBox && hfMatch.box) {
          // HF box is usually [xmin, ymin, xmax, ymax]
          // Gemini expects [ymin, xmin, ymax, xmax]
          const { xmin, ymin, xmax, ymax } = hfMatch.box;
          boundingBox = [ymin, xmin, ymax, xmax];
        }
      }

      return {
        ...ing,
        id: `ing-${Date.now()}-${index}`,
        confidence,
        boundingBox
      };
    });

    const finalResult = {
      ingredients: enrichedIngredients,
      humanDetected: result.humanDetected || false
    };

    // Cache the result
    this.lastImageHash = currentHash;
    this.lastResult = finalResult;

    return finalResult;
  }
}
