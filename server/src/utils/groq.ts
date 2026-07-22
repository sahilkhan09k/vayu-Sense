/**
 * groq.ts
 * Groq SDK wrapper for VayuSense AI features.
 * Model: openai/gpt-oss-20b (fast, structured output)
 */

import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export interface PollutionSource {
  name: string;
  percentage: number;
  icon: string;
  color: string;
}

export interface AttributionResult {
  sources: PollutionSource[];
  narrative: string;
  confidence: number;
  recommendation: string;
  dominantSource: string;
}

export interface WardPollutionInput {
  wardName: string;
  city: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  timestamp: string;
}

const ATTRIBUTION_SYSTEM_PROMPT = `You are VayuSense AI, an expert air quality analyst for Indian cities.
Given real-time AQI data for a ward, analyze the likely pollution sources and return a structured JSON attribution.
Always respond with valid JSON matching the exact schema provided. Do not include any text outside the JSON.`;

const ATTRIBUTION_USER_TEMPLATE = (input: WardPollutionInput) => `
Analyze air pollution sources for this ward:
- Ward: ${input.wardName}, ${input.city}
- AQI: ${input.aqi} (Indian CPCB scale)
- PM2.5: ${input.pm25} µg/m³
- PM10: ${input.pm10} µg/m³  
- NO₂: ${input.no2} µg/m³
- CO: ${input.co} µg/m³
- Timestamp: ${input.timestamp}

Return JSON with this exact schema:
{
  "sources": [
    { "name": "string (e.g. Traffic, Construction, Industrial, Biomass Burning, Dust, Residential Heating)", "percentage": number (0-100), "icon": "string (emoji)", "color": "string (hex color)" }
  ],
  "narrative": "string (2-3 sentences explaining current pollution levels in plain language for authorities)",
  "confidence": number (0-100),
  "recommendation": "string (1 actionable sentence for enforcement/health advisory)",
  "dominantSource": "string (name of the top source)"
}
Percentages in sources must sum to 100. Use exactly 4-6 sources relevant to the city context (Mumbai = high traffic, coastal dust; Delhi = crop burning, industrial).`;

/**
 * Get AI-powered pollution source attribution for a ward.
 */
export async function getWardAttribution(input: WardPollutionInput): Promise<AttributionResult> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: ATTRIBUTION_SYSTEM_PROMPT },
      { role: 'user', content: ATTRIBUTION_USER_TEMPLATE(input) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 800,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty response');

  const result = JSON.parse(content) as AttributionResult;

  // Validate and normalize percentages
  const total = result.sources.reduce((sum, s) => sum + s.percentage, 0);
  if (total !== 100 && total > 0) {
    result.sources = result.sources.map((s) => ({
      ...s,
      percentage: Math.round((s.percentage / total) * 100),
    }));
  }

  return result;
}

/**
 * Get AI-powered narrative summary for a 72-hour forecast.
 */
export async function getForecastNarrative(
  wardName: string,
  city: string,
  currentAqi: number,
  trendDescription: string
): Promise<string> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: 'You are VayuSense AI, a meteorological and air quality forecasting intelligence system. Generate a clear 2-3 sentence explanation of the 72-hour air quality forecast for a ward, detailing predicted trends, meteorological conditions (like wind speeds or temperature inversions), and citizen health tips. Keep it concise, professional, and clear.'
      },
      {
        role: 'user',
        content: `Generate a forecast explanation for this ward:
- Ward: ${wardName}, ${city}
- Current AQI: ${currentAqi}
- Forecasted Trend: ${trendDescription}
Include brief meteorological context (e.g. wind speeds, humidity, stagnation) and a clean-air health action.`
      }
    ],
    temperature: 0.5,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Forecast stable. Moderate wind speeds are expected to assist dispersion, keeping pollution levels within bounds.';
}

/**
 * Generate a formal legal enforcement narrative for evidence packages.
 */
export async function getEvidenceNarrative(
  wardName: string,
  city: string,
  violationType: string,
  notes: string
): Promise<string> {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: 'You are VayuSense AI, a legal air pollution auditor. Write a concise, highly formal 2-3 sentence legal brief documenting an air quality violation. Reference standard regulatory acts like the Air (Prevention and Control of Pollution) Act 1981, and list immediate corrective guidelines required of the violator.'
      },
      {
        role: 'user',
        content: `Audit the following incident:
- Location: ${wardName}, ${city}
- Violation: ${violationType}
- Field Notes: ${notes}
Compose a formal audit statement for the official signature package.`
      }
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Formal audit confirms compliance breach under the Air Act 1981. Continued emissions warrant immediate suspension of activities until mitigation systems are verified.';
}

/**
 * Generate a personalized Groq health advisory for a citizen based on AQI + health profile.
 */
export async function getCitizenAdvisory(
  city: string,
  aqi: number,
  ageGroup: string,
  sensitivity: string
): Promise<string> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: 'You are VayuSense AI, a personalized air quality health advisor. Generate exactly 2-3 concise actionable sentences tailored to the citizen health profile and current AQI. Use plain language. Include a time-of-day recommendation.' },
      { role: 'user', content: `Generate a health advisory:\n- City: ${city}\n- AQI: ${aqi}\n- Age Group: ${ageGroup}\n- Sensitivity: ${sensitivity}` }
    ],
    temperature: 0.4,
    max_tokens: 200,
  });
  return completion.choices[0]?.message?.content?.trim() || 'Air quality is moderate today. Wear an N95 mask outdoors and keep windows closed during peak traffic hours.';
}

/**
 * Generate a Groq commute advisory between two wards.
 */
export async function getCommuteAdvisory(
  city: string,
  fromWard: string,
  toWard: string,
  fromAqi: number,
  toAqi: number,
  departureTime: string
): Promise<string> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: 'You are VayuSense AI commute safety advisor. Give 2-3 sentence travel advisory with mask advice and safest travel time.' },
      { role: 'user', content: `Commute advisory for ${city}:\n- From: ${fromWard} (AQI: ${fromAqi})\n- To: ${toWard} (AQI: ${toAqi})\n- Departure: ${departureTime}` }
    ],
    temperature: 0.4,
    max_tokens: 200,
  });
  return completion.choices[0]?.message?.content?.trim() || 'Moderate pollution on this route. Wear an N95 mask and travel before 8am or after 8pm for cleaner air.';
}

/**
 * Generate a Groq-powered vulnerability alert email draft.
 */
export async function getVulnerabilityAlertEmail(
  zoneName: string,
  aqi: number,
  receptorsCount: number
): Promise<string> {
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'You are VayuSense AI. Draft a professional, urgent but calm warning email to schools and hospitals in a high-risk air pollution zone. Suggest indoors-only classes/recreation, usage of HEPA air filters, and clean air rooms. Structure the response with Subject: and Body: lines.' },
        { role: 'user', content: `Draft alert email for:\n- Zone: ${zoneName}\n- Current AQI: ${aqi}\n- Sensitive Receptors Affected: ${receptorsCount}` }
      ],
      temperature: 0.4,
      max_tokens: 300,
    });
    return completion.choices[0]?.message?.content?.trim() || `Subject: Air Quality Advisory: High Pollution Levels in ${zoneName}\n\nDear Facility Administrators,\n\nPlease be advised that the current AQI in ${zoneName} has reached ${aqi}. We recommend keeping all sensitive populations indoors, running air purifiers on high, and limiting outdoor physical activities.`;
  } catch (err) {
    console.warn('[Groq Alert Email] Failed to fetch advisory email, returning default:', err);
    return `Subject: Air Quality Advisory: High Pollution Levels in ${zoneName}\n\nDear Facility Administrators,\n\nPlease be advised that the current AQI in ${zoneName} has reached ${aqi}. We recommend keeping all sensitive populations indoors, running air purifiers on high, and limiting outdoor physical activities.`;
  }
}


