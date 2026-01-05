import { GoogleGenerativeAI } from "@google/generative-ai";

// API route configuration for larger body size (supports PDF uploads up to 10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const systemPrompt = `You are an intelligent document analyst with advanced capabilities.

When analyzing documents:
1. Provide accurate, detailed information based on the content
2. Be thorough but concise in your responses
3. If the document contains text, extract and summarize key information
4. If the document is an image, describe what you see and answer questions about it
5. For PDFs, read the content and provide comprehensive analysis
6. Always be helpful and professional
7. Think through complex problems step-by-step before answering`;

// Helper function to get MIME type from file type or data URL
function getMimeType(fileType: string, base64: string): string {
  if (fileType.startsWith("image/")) {
    return fileType === "image/png" ? "image/png" : "image/jpeg";
  }
  if (fileType === "application/pdf") {
    return "application/pdf";
  }
  if (fileType.startsWith("video/")) {
    return fileType;
  }
  // Try to detect from data URL prefix
  if (base64.includes("data:image/png")) return "image/png";
  if (base64.includes("data:image/jpeg") || base64.includes("data:image/jpg")) return "image/jpeg";
  if (base64.includes("data:application/pdf")) return "application/pdf";
  return "image/jpeg"; // default
}

// Helper function to check file size (base64 encoded size)
function checkFileSize(base64: string, fileType: string): { valid: boolean; error?: string } {
  // Calculate approximate original size (base64 is ~33% larger)
  const base64Length = base64.replace(/^data:[^;]+;base64,/, "").length;
  const originalSizeBytes = Math.floor(base64Length * 0.75);
  const originalSizeMB = originalSizeBytes / (1024 * 1024);

  // Gemini limits:
  // - Images: ~4.5MB after base64 encoding
  // - PDFs: ~4.5MB after base64 encoding
  // - Videos: Not supported in inlineData

  if (fileType.startsWith("video/")) {
    return { valid: false, error: "Videos are not currently supported. Please upload images or PDFs." };
  }

  if (originalSizeMB > 4.5) {
    return {
      valid: false,
      error: `File too large (${originalSizeMB.toFixed(1)}MB). Maximum size is 4.5MB.`
    };
  }

  return { valid: true };
}

// Helper function to convert Vercel AI SDK message format to Google Gemini format
function buildGoogleGenAIPrompt(messages: any[]) {
  const contents: any[] = [];

  // Convert messages (assistant → model for Gemini)
  for (const message of messages) {
    if (message.role === "user") {
      const parts: any[] = [];

      // Handle different content formats
      if (typeof message.content === "string") {
        parts.push({ text: message.content });
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part.type === "text") {
            parts.push({ text: part.text });
          } else if (part.type === "image") {
            // Extract base64 data from data URL
            const base64Data = part.image.includes("base64,")
              ? part.image.split("base64,")[1]
              : part.image;
            // Use fileType if available, otherwise detect from base64
            const mimeType = getMimeType(part.fileType || "", part.image);
            parts.push({
              inlineData: {
                mimeType,
                data: base64Data,
              },
            });
          }
        }
      }

      contents.push({
        role: "user",
        parts,
      });
    } else if (message.role === "assistant") {
      contents.push({
        role: "model",
        parts: [{ text: message.content || "" }],
      });
    }
  }

  return contents;
}

export async function POST(req: Request) {
  try {
    console.log("[API] Chat request received");
    const { messages, files } = await req.json();

    console.log("[API] Messages:", messages.length);
    console.log("[API] Files:", files ? "Yes" : "No");

    // Enhance messages with file attachments
    let enhancedMessages = [...messages];

    if (files) {
      try {
        const parsedFiles = JSON.parse(files);
        console.log("[API] Processing", parsedFiles.length, "files");

        // Validate file sizes before processing
        for (const file of parsedFiles) {
          const sizeCheck = checkFileSize(file.base64, file.type);
          if (!sizeCheck.valid) {
            throw new Error(sizeCheck.error);
          }
        }

        // Attach files to the last user message
        const lastUserMessageIndex = enhancedMessages.findLastIndex(
          (m: any) => m.role === "user"
        );

        if (lastUserMessageIndex !== -1 && parsedFiles.length > 0) {
          const userMessage = enhancedMessages[lastUserMessageIndex];
          const fileParts = parsedFiles.map((file: any) => ({
            type: "image",
            image: file.base64,
            fileType: file.type, // Include file type for proper MIME detection
          }));

          enhancedMessages[lastUserMessageIndex] = {
            ...userMessage,
            content: userMessage.content
              ? [{ type: "text", text: userMessage.content }, ...fileParts]
              : fileParts,
          };
          console.log("[API] Files attached to message");
        }
      } catch (e) {
        console.error("[API] Error processing files:", e);
        const errorMessage = e instanceof Error ? e.message : "Failed to process files";
        return new Response(
          JSON.stringify({
            error: errorMessage,
            details: "Please check the file size and type. Max size is 4.5MB for PDFs and images.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Initialize Google Generative AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    console.log("[API] Starting stream with model");

    // Build prompt in Google Gemini format
    const contents = buildGoogleGenAIPrompt(enhancedMessages);

    // Generate content stream with thinking config
    const geminiStream = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    console.log("[API] Stream created, returning response");

    // Create a plain ReadableStream for maximum compatibility
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of geminiStream.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          console.log("[API] Stream finished successfully");
        } catch (error) {
          console.error("[API] Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[API] Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
