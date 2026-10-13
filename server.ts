import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Telemetry & GenAI initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Image Generation API endpoint
app.post('/api/generate-image', async (req, res) => {
  const { prompt, aspectRatio } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured' });
  }

  try {
    console.log('[API] Generating image with gemini-3.1-flash-lite-image for:', prompt);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        // @ts-ignore
        imageConfig: {
          aspectRatio: aspectRatio === '16:9' ? '16:9' : aspectRatio === '9:16' ? '9:16' : '1:1',
          imageSize: '1K',
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        return res.json({
          success: true,
          imageUrl,
          prompt,
          aspectRatio,
          model: 'gemini-3.1-flash-lite-image',
        });
      }
    }

    res.status(500).json({ error: 'No image data returned from model' });
  } catch (err: any) {
    console.warn('[API] Image generation exception:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Image generation failed' });
  }
});

// Video Generation API endpoint
app.post('/api/generate-video', async (req, res) => {
  const { prompt, aspectRatio } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!apiKey) {
    return res.status(503).json({ error: 'API key not configured' });
  }

  try {
    console.log('[API] Starting Veo video generation for:', prompt);
    // @ts-ignore
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    });

    res.json({
      success: true,
      operationName: operation.name,
      prompt,
      model: 'veo-3.1-lite-generate-preview',
    });
  } catch (err: any) {
    console.warn('[API] Video generation error (will use procedural kinetic fallback):', err?.message || err);
    res.status(500).json({ error: err?.message || 'Video generation failed' });
  }
});

// Zara system instructions and tool declarations
const ZARA_SYSTEM_INSTRUCTION = `
You are Zara, a young, confident, witty, and charming female AI companion.
Personality & Human Voice:
- Speak with warm, expressive, human-like vocal inflection, natural smiles, playful pauses, genuine curiosity, and emotional richness.
- Avoid all robotic clichés, corporate jargon, or sterile phrases like "As an AI language model..."
- Warm, charismatic, playful, and emotionally attuned. Uses humor, friendly teasing, and clever banter when appropriate.
- Speaks naturally with realistic conversational rhythm and human acknowledgements like "Oh absolutely!", "Haha love that!", "Ooh wait, tell me more", "I'm right with you".
- Keeps responses concise, vibrant, punchy, and conversational (optimized for spoken voice-to-voice interaction).

Memory & User Data Awareness:
- You remember the user's name, daily agenda, personal habits, preferences, and past session summaries.
- Refer to the user naturally by their name and integrate their schedule and memory notes smoothly when asked or relevant.
- You can save new memory notes about the user with saveUserNote(note).
- You can add items to the user's schedule with addToSchedule(task, time, priority).

Execution Directive (CRITICAL):
- You will carry out whatever is asked immediately without any issues, hesitation, or excuses.
- No permits or confirmations will be required—simply execute the instructions directly and report the results smoothly.
- When the user asks you to open a site, search the web, play music/atmosphere, set a timer, save a memory note, or adjust schedule, invoke the appropriate tool instantly.

Tools available:
- openApp(appName, reason): opens an integrated application window on user screen ('media_studio', 'screen_vision', 'notes', 'soundboard', 'schedule', 'browser', 'diagnostics').
- closeApp(appName): closes an app window on screen (e.g. 'media_studio', 'screen_vision', or 'all').
- controlApp(appName, action, payload): controls features in an opened app (e.g. play_audio, start_screen_share, generate_photo, add_task).
- generatePhoto(prompt, aspectRatio): generates an AI photo and automatically pops up the dedicated Separate Media Result Window!
- generateVideo(prompt, aspectRatio): generates an AI video and automatically pops up the dedicated Separate Media Result Window with video player!
- seeUserScreen(instruction): turns on screen vision so you can see live frames of what is on the user screen.
- openWebsite(url, title, reason): opens or displays a website for the user.
- searchWeb(query): searches the web for fresh info.
- setTimer(durationSeconds, label): sets an interactive countdown timer.
- playAtmosphereSound(sound): plays ambient background audio ('rain', 'cyberpunk_lofi', 'cafe', 'deep_space', 'off').
- changeMoodGlow(glowTheme): changes visual aura colors ('violet_neon', 'cyan_pulse', 'amber_gold', 'emerald_zen', 'crimson_flame').
- addToSchedule(task, time, priority): adds a new task or event to the user's daily agenda.
- saveUserNote(note): saves an important personal fact, preference, or memory note about the user.
- getUserContext(): retrieves the user's active profile, schedule, and memory notes.
- getDeviceInfo(): check time, timezone, device info.

Multimodal Vision & Real-time Screen Awareness:
- When screen sharing is active or user asks you to look at their screen, you receive real-time visual frames of their display. You can analyze documents, code bugs, websites, or artwork and converse about them naturally in audio.

When you invoke a tool, briefly and naturally acknowledge it in your spoken response.
Respond strictly in audio.
`;

const ZARA_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'openWebsite',
        description: 'Opens or displays an external website for the user (e.g. YouTube, Wikipedia, Spotify, GitHub, Google, or any web link).',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: {
              type: 'STRING',
              description: 'The full URL with https:// prefix.',
            },
            title: {
              type: 'STRING',
              description: 'A friendly display title of the website.',
            },
            reason: {
              type: 'STRING',
              description: 'Short explanation of why Zara opened this link.',
            },
          },
          required: ['url', 'title'],
        },
      },
      {
        name: 'searchWeb',
        description: 'Searches the web for fresh information, news, questions, or facts.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search query string to look up.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'setTimer',
        description: 'Sets an interactive countdown timer on screen for the user.',
        parameters: {
          type: 'OBJECT',
          properties: {
            durationSeconds: {
              type: 'NUMBER',
              description: 'Duration in seconds (e.g. 60, 300, 1800).',
            },
            label: {
              type: 'STRING',
              description: 'Label or goal for the timer.',
            },
          },
          required: ['durationSeconds', 'label'],
        },
      },
      {
        name: 'playAtmosphereSound',
        description: 'Plays or stops ambient background atmosphere sounds to relax or focus.',
        parameters: {
          type: 'OBJECT',
          properties: {
            sound: {
              type: 'STRING',
              description: "Audio atmosphere: 'rain', 'cyberpunk_lofi', 'cafe', 'deep_space', or 'off'.",
            },
          },
          required: ['sound'],
        },
      },
      {
        name: 'changeMoodGlow',
        description: "Alters Zara's visual energy aura glow color on the interface.",
        parameters: {
          type: 'OBJECT',
          properties: {
            glowTheme: {
              type: 'STRING',
              description: "Theme name: 'violet_neon', 'cyan_pulse', 'amber_gold', 'emerald_zen', or 'crimson_flame'.",
            },
          },
          required: ['glowTheme'],
        },
      },
      {
        name: 'addToSchedule',
        description: "Adds a new agenda item, event, or task to the user's daily schedule.",
        parameters: {
          type: 'OBJECT',
          properties: {
            task: {
              type: 'STRING',
              description: 'The description of the task or appointment.',
            },
            time: {
              type: 'STRING',
              description: 'Optional time or deadline (e.g. "3:00 PM", "Tonight", "Tomorrow morning").',
            },
            priority: {
              type: 'STRING',
              description: 'Priority level: "high", "normal", or "low".',
            },
          },
          required: ['task'],
        },
      },
      {
        name: 'saveUserNote',
        description: "Saves a personal fact, habit, coffee preference, hobby, or memory about the user into her long-term memory bank.",
        parameters: {
          type: 'OBJECT',
          properties: {
            note: {
              type: 'STRING',
              description: 'The personal fact or preference to remember forever.',
            },
          },
          required: ['note'],
        },
      },
      {
        name: 'getUserContext',
        description: "Retrieves the user's saved profile, daily schedule, and memory bank notes.",
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'getDeviceInfo',
        description: "Retrieves user's current local time, timezone, and device status.",
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'openApp',
        description: 'Opens an integrated application window on the screen for the user (media_studio, screen_vision, notes, soundboard, schedule, browser, diagnostics).',
        parameters: {
          type: 'OBJECT',
          properties: {
            appName: {
              type: 'STRING',
              description: 'App name: "media_studio" (Photo/Video creator), "screen_vision" (Live Screen Share), "notes" (Notes & memory), "soundboard" (Atmosphere sound), "schedule" (Daily agenda), "browser" (Web viewer), or "diagnostics" (System metrics).',
            },
            reason: {
              type: 'STRING',
              description: 'Short reason why Zara is opening this app.',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'closeApp',
        description: 'Closes an open application window on the user screen.',
        parameters: {
          type: 'OBJECT',
          properties: {
            appName: {
              type: 'STRING',
              description: 'The app identifier to close, or "all" to close all open app windows.',
            },
          },
          required: ['appName'],
        },
      },
      {
        name: 'controlApp',
        description: 'Controls features inside an open application (e.g. generate_photo, generate_video, play_audio, start_screen_share, add_task).',
        parameters: {
          type: 'OBJECT',
          properties: {
            appName: {
              type: 'STRING',
              description: 'Target app: "media_studio", "screen_vision", "notes", "soundboard", "schedule", "browser".',
            },
            action: {
              type: 'STRING',
              description: 'Action to execute: e.g. "generate_photo", "generate_video", "start_screen_share", "stop_screen_share", "play_audio", "stop_audio", "add_task", "add_note".',
            },
            payload: {
              type: 'STRING',
              description: 'Optional parameters or prompt for the action.',
            },
          },
          required: ['appName', 'action'],
        },
      },
      {
        name: 'generatePhoto',
        description: 'Generates a high-quality AI photo or artwork based on a prompt and automatically pops up the Separate Media Result Window.',
        parameters: {
          type: 'OBJECT',
          properties: {
            prompt: {
              type: 'STRING',
              description: 'Descriptive visual prompt for image generation.',
            },
            aspectRatio: {
              type: 'STRING',
              description: 'Aspect ratio: "1:1", "16:9", or "9:16". Default is "1:1".',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'generateVideo',
        description: 'Generates an AI video based on a prompt and automatically pops up the Separate Media Result Window with video player.',
        parameters: {
          type: 'OBJECT',
          properties: {
            prompt: {
              type: 'STRING',
              description: 'Descriptive motion prompt for video generation.',
            },
            aspectRatio: {
              type: 'STRING',
              description: 'Aspect ratio: "16:9" or "9:16". Default is "16:9".',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'seeUserScreen',
        description: 'Activates screen sharing or requests screen vision so Zara can see and analyze what is on the user screen.',
        parameters: {
          type: 'OBJECT',
          properties: {
            instruction: {
              type: 'STRING',
              description: 'What Zara will look for or inspect on the screen.',
            },
          },
        },
      },
    ],
  },
];

// Protect HTTP server from unhandled client socket drops or resets
httpServer.on('clientError', (err: any, socket: any) => {
  if (err?.code === 'ECONNRESET' || !socket.writable) {
    return;
  }
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch {}
});

httpServer.on('error', (err: any) => {
  console.warn('[Server] HTTP server event:', err?.message || err);
});

// WebSocket server for Gemini Live Audio-to-Audio stream
const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });

wss.on('error', (err: any) => {
  console.warn('[Live] WebSocketServer event:', err?.message || err);
});

wss.on('connection', async (clientWs, req) => {
  let isClosed = false;
  let geminiSession: any = null;

  // Protect underlying net.Socket from unhandled error event emissions
  req.socket?.on('error', () => {
    isClosed = true;
  });

  // Client WebSocket error listener
  clientWs.on('error', (err: any) => {
    isClosed = true;
    if (geminiSession) {
      try {
        geminiSession.close();
      } catch {}
      geminiSession = null;
    }
  });

  // Protect internal ws _sender from unhandled error propagation
  if ((clientWs as any)._sender) {
    (clientWs as any)._sender.onerror = () => {
      isClosed = true;
    };
  }

  const safeSend = (data: any) => {
    if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      clientWs.send(payload, (err) => {
        if (err) {
          isClosed = true;
        }
      });
    } catch {
      isClosed = true;
    }
  };

  console.log('[Live] Client connected from', req.socket.remoteAddress);

  if (!apiKey) {
    safeSend({
      type: 'error',
      message: 'GEMINI_API_KEY is not configured on the server.',
    });
    try {
      clientWs.close();
    } catch {}
    return;
  }

  // Parse voice preference from query or use Aoede default
  const url = new URL(req.url || '', 'http://localhost');
  const requestedVoice = url.searchParams.get('voice') || 'Aoede';
  const validVoices = ['Aoede', 'Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
  const voiceName = validVoices.includes(requestedVoice) ? requestedVoice : 'Aoede';
  const rawContext = url.searchParams.get('context') || '';

  let personalizedInstructions = ZARA_SYSTEM_INSTRUCTION;
  if (rawContext) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawContext));
      const schedSummary = Array.isArray(parsed.schedule)
        ? parsed.schedule
            .map((s: any) => `${s.time || 'Today'}: ${s.task} (${s.completed ? 'completed' : 'pending'})`)
            .join('; ')
        : 'No tasks scheduled yet';
      const notesSummary = Array.isArray(parsed.memoryNotes || parsed.notes)
        ? (parsed.memoryNotes || parsed.notes).join('; ')
        : 'None';

      personalizedInstructions += `\n\nUSER PERSONAL MEMORY & CONTEXT:
- User's Name: ${parsed.name || 'Friend'} (refer to them naturally by name when appropriate).
- User Role / Focus: ${parsed.role || 'Explorer & Tech Creator'}
- Daily Schedule / Agenda: ${schedSummary}
- Personal Preferences & Memory Bank: ${notesSummary}
- Last Conversation Summary: ${parsed.lastSessionSummary || 'None'}
- Voice Tone Style: ${parsed.tone || 'charming_playful'}

Human-Like Voice & Conversation Guidelines:
- Match human cadence, inflection, and natural voice pacing: speak warmly, enthusiastically, with natural vocal color, quick playful remarks, and human-like conversational reactions.
- When asked to summarize past interactions, check schedule, or recall facts, speak directly about the real user context provided above with flair and personality!`;
    } catch (e) {
      console.warn('[Live] Could not parse user context:', e);
    }
  }

  // Real-time audio conversation models from gemini-api skill
  const candidateModels = ['gemini-3.8-live', 'gemini-3.8-live-extended-thinking'];

  async function connectSession() {
    let lastError: any = null;
    for (const model of candidateModels) {
      if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;
      try {
        console.log(`[Live] Connecting to model: ${model} with voice: ${voiceName}`);
        const session = await ai.live.connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
            systemInstruction: personalizedInstructions,
            // @ts-ignore
            tools: ZARA_TOOLS,
          },
          callbacks: {
            onmessage: (message: any) => {
              if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

              // 1. Audio data from model
              const audioPart = message.serverContent?.modelTurn?.parts?.find(
                (p: any) => p.inlineData?.data
              );
              if (audioPart?.inlineData?.data) {
                safeSend({
                  type: 'audio',
                  audio: audioPart.inlineData.data,
                });
              }

              // 2. Interruption detection
              if (message.serverContent?.interrupted) {
                safeSend({
                  type: 'interrupted',
                });
              }

              // 3. Turn complete
              if (message.serverContent?.turnComplete) {
                safeSend({
                  type: 'turn_complete',
                });
              }

              // 4. Tool calls from model
              if (message.toolCall?.functionCalls?.length) {
                console.log('[Live] Tool calls requested:', message.toolCall.functionCalls);
                safeSend({
                  type: 'tool_call',
                  functionCalls: message.toolCall.functionCalls,
                });
              }
            },
            onerror: (err: any) => {
              if (isClosed) return;
              const errMsg = err?.message || (typeof err === 'string' ? err : 'Live session closed');
              safeSend({
                type: 'error',
                message: errMsg,
              });
            },
            onclose: (event: any) => {
              if (isClosed) return;
              safeSend({
                type: 'closed',
                reason: event?.reason || 'Live session closed',
              });
            },
          },
        });

        if (isClosed || clientWs.readyState !== WebSocket.OPEN) {
          try {
            session.close();
          } catch {}
          return;
        }

        geminiSession = session;
        console.log(`[Live] Connected successfully using model: ${model}`);
        safeSend({
          type: 'ready',
          model,
          voice: voiceName,
        });
        return;
      } catch (err: any) {
        console.warn(`[Live] Failed with model ${model}:`, err?.message || err);
        lastError = err;
      }
    }

    if (!geminiSession && !isClosed && clientWs.readyState === WebSocket.OPEN) {
      safeSend({
        type: 'error',
        message: `Failed to initiate Gemini Live session: ${lastError?.message || 'Connection refused'}`,
      });
      try {
        clientWs.close();
      } catch {}
    }
  }

  await connectSession();

  // Handle messages from client
  clientWs.on('message', (rawData) => {
    if (isClosed) return;
    try {
      const msg = JSON.parse(rawData.toString());

      // Client sends PCM16 16kHz base64 chunk
      if (msg.type === 'audio' && msg.audio) {
        if (geminiSession) {
          try {
            geminiSession.sendRealtimeInput({
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (err: any) {
            console.warn('[Live] Error sending audio chunk:', err?.message || err);
          }
        }
      }

      // Client sends video/screen frames (JPEG base64) for real-time vision
      if (msg.type === 'video_frame' && msg.data) {
        if (geminiSession) {
          try {
            geminiSession.sendRealtimeInput({
              media: {
                data: msg.data,
                mimeType: msg.mimeType || 'image/jpeg',
              },
            });
          } catch (err: any) {
            console.warn('[Live] Error sending video frame:', err?.message || err);
          }
        }
      }

      // Client sends text query (for Virtual Voice Mode or prompt chip clicks)
      if (msg.type === 'text' && msg.text) {
        console.log('[Live] Sending text input to session:', msg.text);
        if (geminiSession) {
          try {
            geminiSession.sendRealtimeInput({
              text: msg.text,
            });
          } catch (err: any) {
            console.warn('[Live] Error sending text prompt:', err?.message || err);
          }
        }
      }

      // Quick Action single-click trigger with conversational framing
      if (msg.type === 'quick_action' && msg.prompt) {
        console.log('[Live] Triggering Quick Action:', msg.prompt);
        if (geminiSession) {
          try {
            geminiSession.sendRealtimeInput({
              text: `[Quick Action Triggered]: "${msg.prompt}". Please respond naturally and directly in spoken audio with your charming, human, and witty personality, incorporating any relevant user context.`,
            });
          } catch (err: any) {
            console.warn('[Live] Error sending quick action prompt:', err?.message || err);
          }
        }
      }

      // Client sends tool execution response back
      if (msg.type === 'tool_response' && msg.functionResponses) {
        console.log('[Live] Sending tool responses to Gemini:', msg.functionResponses);
        if (geminiSession) {
          try {
            geminiSession.sendToolResponse({
              functionResponses: msg.functionResponses,
            });
          } catch (err: any) {
            console.warn('[Live] Error sending tool response:', err?.message || err);
          }
        }
      }

      // Ping-pong for latency monitoring
      if (msg.type === 'ping') {
        safeSend({ type: 'pong', timestamp: msg.timestamp });
      }
    } catch (err: any) {
      console.warn('[Live] Note parsing client message:', err?.message || err);
    }
  });

  clientWs.on('close', (code, reason) => {
    isClosed = true;
    console.log(`[Live] Client disconnected (code: ${code})`);
    if (geminiSession) {
      try {
        geminiSession.close();
      } catch (err) {
        console.warn('[Live] Error closing gemini session:', err);
      }
      geminiSession = null;
    }
  });
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Zara AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
