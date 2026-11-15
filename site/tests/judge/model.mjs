const VERSION = '2023-06-01';
const MAX_TOKENS = 16000;

export const defaultModel = () => process.env.JUDGE_MODEL || 'claude-sonnet-5-5';

async function post({ system, user, model, apiKey, baseUrl }) {
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': VERSION, 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system, messages: [{ role: 'user', content: user }] }),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await response.text();
  if (!response.ok) {
    const error = new Error(`Anthropic API answered ${response.status}: ${body.slice(0, 300)}`);
    error.retryable = response.status === 429 || response.status >= 500;
    throw error;
  }
  return JSON.parse(body);
}

export async function askModel({ system, user, model, apiKey, baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com' }) {
  let reply;
  try {
    reply = await post({ system, user, model, apiKey, baseUrl });
  } catch (error) {
    if (error.retryable === false) throw error;
    await new Promise((done) => setTimeout(done, 2000));
    reply = await post({ system, user, model, apiKey, baseUrl });
  }
  if (reply.stop_reason === 'refusal') throw new Error('the model refused to answer');
  if (reply.stop_reason === 'max_tokens') throw new Error('the answer was cut off at max_tokens');
  const block = reply.content?.find((part) => part.type === 'text');
  if (!block) throw new Error('the reply holds no text block');
  return block.text;
}
