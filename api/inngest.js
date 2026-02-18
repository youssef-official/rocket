import { Inngest } from "inngest";
import { serve } from "inngest/vercel";

// Initialize Inngest with minimal config for debugging
export const inngest = new Inngest({ 
  id: "vivora-api"
});

// Define a simple dummy function
const helloWorld = inngest.createFunction(
  { id: "hello-world", name: "Hello World" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.run("say-hello", async () => {
      return { message: "Hello from Inngest!" };
    });
  }
);

// Create the serve handler
const inngestHandler = serve({
  client: inngest,
  functions: [
    helloWorld,
  ],
});

export default async function handler(req, res) {
  try {
    // Add simple logging or check
    console.log("Inngest handler called", req.method);
    
    // Handle custom send-event for frontend compatibility
    if (req.method === 'POST') {
      let body = {};
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      } catch (e) {}

      if (body.action === 'send-event') {
        await inngest.send({
          name: body.eventName,
          data: body.eventData || {},
        });
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ ok: true });
      }
    }

    return await inngestHandler(req, res);
  } catch (error) {
    console.error("Inngest Handler Error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
