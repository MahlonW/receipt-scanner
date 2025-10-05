import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().describe('The name of the product'),
  price: z.number().describe('The price of the product'),
  quantity: z.number().optional().describe('The quantity of the product'),
  category: z.string().optional().describe('The category of the product'),
  description: z.string().optional().describe('A brief description of the product'),
});

const receiptSchema = z.object({
  products: z.array(productSchema).describe('Array of products found on the receipt'),
  total: z.number().describe('The total amount of the receipt'),
  tax: z.number().optional().describe('The tax amount'),
  subtotal: z.number().optional().describe('The subtotal before tax'),
  store: z.string().optional().describe('The name of the store'),
  date: z.string().optional().describe('The date of the receipt'),
});

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [ANALYZE-RECEIPT] Starting receipt analysis`);
  
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    console.log(`[${requestId}] [ANALYZE-RECEIPT] Image file: ${image?.name}, size: ${image?.size} bytes`);
    
    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const modelName = process.env.OPENAI_MODEL || 'gpt-5-nano';
    
    console.log(`[${requestId}] [ANALYZE-RECEIPT] Using model: ${modelName}`);
    console.log(`[${requestId}] [ANALYZE-RECEIPT] Calling OpenAI API...`);
    
    const result = await generateObject({
      model: openai(modelName), // Configurable model via environment variable
      schema: receiptSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this receipt or invoice image and extract all products with their details. For each product, provide: name (string), price (number), quantity (number, optional), category (string, optional), and description (string, optional). Also extract: total (number), tax (number, optional), subtotal (number, optional), store (string, optional), and date (string, optional). Return ONLY valid JSON that matches the required schema - do not include any text outside the JSON structure.',
            },
            {
              type: 'image',
              image: dataUrl,
            },
          ],
        },
      ],
    });

    const { object, usage } = result;
    
    console.log(`[${requestId}] [ANALYZE-RECEIPT] OpenAI API call completed successfully`);
    console.log(`[${requestId}] [ANALYZE-RECEIPT] Extracted ${object.products.length} products from receipt`);
        
    // Extract token usage with proper property access
    const usageData = usage as Record<string, unknown>;
    
    // Try different possible property names for token counts
    const promptTokens = Number(
      usageData.promptTokens || 
      usageData.prompt_tokens || 
      usageData.inputTokens ||
      usageData.input_tokens ||
      0
    );
    
    const completionTokens = Number(
      usageData.completionTokens || 
      usageData.completion_tokens || 
      usageData.outputTokens ||
      usageData.output_tokens ||
      0
    );
    
    const totalTokens = Number(
      usageData.totalTokens || 
      usageData.total_tokens || 
      usageData.tokens ||
      0
    );

    // If we have total tokens but individual counts are 0, estimate the breakdown
    let finalPromptTokens = promptTokens;
    let finalCompletionTokens = completionTokens;
    
    if (totalTokens > 0 && promptTokens === 0 && completionTokens === 0) {
      // Estimate 80% prompt, 20% completion for image analysis
      finalPromptTokens = Math.floor(totalTokens * 0.8);
      finalCompletionTokens = Math.floor(totalTokens * 0.2);
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [ANALYZE-RECEIPT] Request completed successfully in ${duration}ms`);
    console.log(`[${requestId}] [ANALYZE-RECEIPT] Token usage: ${finalPromptTokens} prompt + ${finalCompletionTokens} completion = ${totalTokens} total`);
    
    return Response.json({
      ...object,
      tokenUsage: {
        promptTokens: finalPromptTokens,
        completionTokens: finalCompletionTokens,
        totalTokens,
        cost: `$${((finalPromptTokens * 0.0005) + (finalCompletionTokens * 0.0015) / 1000).toFixed(4)}`
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [ANALYZE-RECEIPT] Error after ${duration}ms:`, error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to analyze receipt';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing OpenAI API key';
      } else if (error.message.includes('schema')) {
        errorMessage = 'Unable to parse receipt data. Please try a clearer image.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
    }
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}