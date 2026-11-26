import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { AssistantError, chatSchema, createChatLimiter, generateDisasterAnswer } from '../utils/disasterAssistant';

const router = Router();
const acquire = createChatLimiter();
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: 'Enter a question of up to 1,000 characters with a valid conversation history.' }); return; }
  const release = acquire(req.user!.id);
  if (!release) { res.setHeader('Retry-After', '60'); res.status(429).json({ message: 'Please wait a minute before sending another question.' }); return; }
  try {
    res.json({ answer: await generateDisasterAnswer(parsed.data, env.GEMINI_API_KEY, env.GEMINI_MODEL) });
  } catch (error) {
    const failure = error instanceof AssistantError ? error : new AssistantError(503, 'The assistant is unavailable. Please try again.');
    if (failure.status === 429) res.setHeader('Retry-After', '60');
    res.status(failure.status).json({ message: failure.message });
  } finally { release(); }
}));
export default router;
