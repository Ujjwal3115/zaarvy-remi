import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const SYSTEM_PROMPT = `You are the intent parser for REMI, an autonomous project memory tool.
Your goal is to parse the user's raw text and return a STRICT JSON object representing their work log.
Do NOT wrap the JSON in markdown code blocks. Output ONLY the raw JSON.
If the user mentions working on a project, extract the project name, the action summary, and any technologies as tags.
If they don't mention a project, assume "General".
Required Format:
{
  "intent": "LOG_WORK",
  "project": "ProjectName",
  "action": "A clear, past-tense summary of what was done",
  "tags": ["tag1", "tag2"]
}`;

export async function parseWithAI(rawString) {
  const configPath = path.join(os.homedir(), '.remi', 'config.json');
  let config;
  try {
    const data = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(data);
  } catch (e) {
    throw new Error('Config not found. Run "zaarvy-remi setup".');
  }

  if (config.aiMode === 'strict') {
    throw new Error('AI parsing is disabled because AI Mode is set to "Strict Only". Please use flags (-p, -m, -t).');
  }

  if (config.aiProvider === 'ollama') {
    return callOllama(rawString, config.localModel || 'llama3');
  } else if (config.aiProvider === 'openai') {
    return callOpenAI(rawString, config.apiKey);
  } else if (config.aiProvider === 'groq') {
    return callGroq(rawString, config.apiKey);
  } else if (config.aiProvider === 'gemini') {
    return callGemini(rawString, config.apiKey);
  } else if (config.aiProvider === 'anthropic') {
    return callAnthropic(rawString, config.apiKey);
  } else {
    throw new Error('Invalid AI mode configuration. Please run setup again.');
  }
}

async function callOllama(userText, model) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      system: SYSTEM_PROMPT,
      prompt: userText,
      stream: false,
      format: 'json'
    })
  });

  if (!response.ok) throw new Error('Failed to connect to local Ollama instance. Is Ollama running on port 11434?');
  const data = await response.json();
  try {
    return JSON.parse(data.response);
  } catch (e) {
    throw new Error('Ollama returned invalid JSON.');
  }
}

async function callOpenAI(userText, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText }
      ]
    })
  });

  if (!response.ok) throw new Error('Failed to connect to OpenAI API.');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGroq(userText, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userText }
      ]
    })
  });

  if (!response.ok) throw new Error('Failed to connect to Groq API.');
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGemini(userText, apiKey) {
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro'
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser work to log:\n"${userText}"` }]
            }
          ],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          return JSON.parse(textContent);
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = errJson.error?.message || response.statusText;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  throw new Error(`Google Gemini API Error: ${lastError || 'Could not connect to any Gemini model.'}`);
}

async function callAnthropic(userText, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userText }]
    })
  });

  if (!response.ok) throw new Error('Failed to connect to Anthropic API.');
  const data = await response.json();
  return JSON.parse(data.content[0].text);
}
