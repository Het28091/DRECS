import OpenAI from 'openai';
import { INCIDENT_SEVERITIES, IncidentSeverity } from '../models/Incident';

let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI | null => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('your_')) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: apiKey.trim() });
  }
  return openaiClient;
};

export interface OpenAiVerificationResult {
  isValid: boolean;
  isFlaggedByModeration: boolean;
  aiSeverity: IncidentSeverity;
  finalSeverity: IncidentSeverity;
  aiSeverityMatch: boolean;
  reason: string;
}

/**
 * Lore-accurate Emergency Severity Framework:
 * - CRITICAL: Active life-threatening emergency, trapped individuals, flash flooding, active building collapse, severe fire with casualties.
 * - HIGH: Severe structural damage, high water levels, active fire without reported traps, urgent medical distress.
 * - MEDIUM: Moderate localized flooding, blocked main roads, minor structural cracking, non-life-threatening hazard.
 * - LOW: Minor localized issue, preventative alert, post-event cleanup request, non-urgent query.
 */

export async function verifyWithOpenAI(payload: {
  title: string;
  description: string;
  category: string;
  userSeverity: IncidentSeverity;
  location?: { latitude: number; longitude: number; address?: string };
}): Promise<OpenAiVerificationResult> {
  const { title, description, category, userSeverity, location } = payload;
  const client = getOpenAIClient();

  // Local rule-based fallback if OpenAI API key is missing or invalid
  const fallbackAiSeverity = deriveLocalSeverity(title, description, category);
  const fallbackMatch = userSeverity === fallbackAiSeverity;
  const fallbackFinal = fallbackMatch ? userSeverity : fallbackAiSeverity;

  if (!client) {
    return {
      isValid: true,
      isFlaggedByModeration: false,
      aiSeverity: fallbackAiSeverity,
      finalSeverity: fallbackFinal,
      aiSeverityMatch: fallbackMatch,
      reason: fallbackMatch
        ? `Local Rule Engine verified severity matches user selection (${userSeverity}).`
        : `Local Rule Engine adjusted severity from ${userSeverity} to ${fallbackAiSeverity} based on report text analysis.`,
    };
  }

  try {
    const combinedInput = `Title: ${title}. Category: ${category}. Description: ${description}. Address: ${location?.address || 'N/A'}`;

    // 1. Call OpenAI Free Moderation API
    const modResponse = await client.moderations.create({
      model: 'omni-moderation-latest',
      input: combinedInput,
    });

    const modResult = modResponse.results[0];

    if (modResult && modResult.flagged) {
      const categoriesObj = modResult.categories as unknown as Record<string, boolean>;
      const flaggedCategories = Object.keys(categoriesObj)
        .filter((cat) => categoriesObj[cat])
        .join(', ');

      return {
        isValid: false,
        isFlaggedByModeration: true,
        aiSeverity: 'LOW',
        finalSeverity: 'LOW',
        aiSeverityMatch: false,
        reason: `OpenAI Moderation Flagged: Content contains inappropriate material (${flaggedCategories}).`,
      };
    }

    // 2. Lore-Accurate GPT-4o-Mini Emergency Analysis
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert UN/FEMA Emergency Command Assessor.
Evaluate the disaster report according to official emergency response & verification standards.

VALIDATION RULES:
- "isValidEmergency": Set to FALSE if the report contains random numbers (e.g. "12312 41jk23"), keyboard mash, mixed character noise, test submissions, jokes, or meaningless text.
- Set "isValidEmergency" to TRUE ONLY if the text describes a genuine emergency situation.

SEVERITY RULES:
- CRITICAL: Direct threat to life, people trapped, active building collapse, severe flash flood, raging fire with casualties.
- HIGH: Severe damage, active fire, major medical emergency, rapidly rising waters.
- MEDIUM: Moderate damage, blocked roads, localized minor flooding, non-life-threatening hazard.
- LOW: Minor issue, non-urgent advisory, minor debris cleanup.

Evaluate the whole report and determine:
1. "isValidEmergency": boolean
2. "aiSeverity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
3. "reason": clear professional explanation of the assessment.

Respond ONLY in valid JSON format:
{
  "isValidEmergency": boolean,
  "aiSeverity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reason": "explanation string"
}`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            title,
            description,
            category,
            userSubmittedSeverity: userSeverity,
            locationCoordinates: location ? `${location.latitude}, ${location.longitude}` : 'Unknown',
            address: location?.address || 'Unknown',
          }),
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.1,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (responseContent) {
      const parsed = JSON.parse(responseContent);

      if (parsed.isValidEmergency === false) {
        return {
          isValid: false,
          isFlaggedByModeration: false,
          aiSeverity: 'LOW',
          finalSeverity: 'LOW',
          aiSeverityMatch: false,
          reason: parsed.reason || 'OpenAI verification failed: Report does not describe a genuine emergency.',
        };
      }

      const aiSeverity = (INCIDENT_SEVERITIES.includes(parsed.aiSeverity)
        ? parsed.aiSeverity
        : fallbackAiSeverity) as IncidentSeverity;

      const isMatch = userSeverity === aiSeverity;
      // Arbitration rule: If match, use userSeverity; else AI takes final decision
      const finalSeverity = isMatch ? userSeverity : aiSeverity;

      return {
        isValid: true,
        isFlaggedByModeration: false,
        aiSeverity,
        finalSeverity,
        aiSeverityMatch: isMatch,
        reason: isMatch
          ? `AI Assessor verified and confirmed user-selected priority (${userSeverity}).`
          : `AI Assessor re-classified priority from ${userSeverity} to ${aiSeverity}: ${parsed.reason}`,
      };
    }

    return {
      isValid: true,
      isFlaggedByModeration: false,
      aiSeverity: fallbackAiSeverity,
      finalSeverity: fallbackFinal,
      aiSeverityMatch: fallbackMatch,
      reason: 'AI verification completed.',
    };
  } catch (error: any) {
    console.warn('OpenAI API verification check failed or skipped:', error?.message || error);
    return {
      isValid: true,
      isFlaggedByModeration: false,
      aiSeverity: fallbackAiSeverity,
      finalSeverity: fallbackFinal,
      aiSeverityMatch: fallbackMatch,
      reason: 'Local rule engine processed report severity.',
    };
  }
}

/**
 * Local Rule-based Disaster Severity Classification Engine (Fallback)
 */
function deriveLocalSeverity(title: string, description: string, category: string): IncidentSeverity {
  const text = `${title} ${description} ${category}`.toLowerCase();

  const CRITICAL_KEYWORDS = ['trapped', 'collapse', 'drowning', 'casualty', 'fatal', 'flash flood', 'raging fire', 'explosion', 'suffocating', 'unconscious'];
  const HIGH_KEYWORDS = ['severe', 'fire', 'heavy flood', 'medical emergency', 'bleeding', 'major damage', 'landslide', 'evacuate', 'rescue needed'];
  const LOW_KEYWORDS = ['minor', 'puddle', 'trash', 'inquiry', 'small leak', 'advisory', 'post-event'];

  if (CRITICAL_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'CRITICAL';
  }
  if (HIGH_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'HIGH';
  }
  if (LOW_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'LOW';
  }
  return 'MEDIUM';
}
