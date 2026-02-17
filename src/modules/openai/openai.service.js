const { getOpenAIClient } = require("./openai.client");

/**
 * @typedef {Object} OpenAIChatOptions
 * @property {string} systemPrompt - System instruction (role/context) for the model.
 * @property {string} userMessage - User message / content to be analyzed.
 * @property {string} [model='gpt-4o-mini'] - OpenAI model to be used.
 * @property {number} [temperature=0.2] - Controls the randomness of responses (0 = deterministic, 2 = creative).
 * @property {number} [maxTokens=4096] - Maximum number of tokens in the response.
 */

/**
 * @typedef {Object} OpenAIChatResponse
 * @property {string} content - Textual content of the model's response.
 * @property {Object} usage - Token consumption information.
 * @property {number} usage.promptTokens - Tokens used in the prompt.
 * @property {number} usage.completionTokens - Tokens used in the response.
 * @property {number} usage.totalTokens - Total tokens consumed.
 * @property {string} model - Model effectively used in the response.
 */

/**
 * Performs a call to the OpenAI chat completions API.
 *
 * @param {OpenAIChatOptions} options - Parameters for the call.
 * @returns {Promise<OpenAIChatResponse>} Processed response from OpenAI.
 * @throws {Error} If the API call fails.
 *
 * @example
 * const response = await chat({
 * systemPrompt: 'You are a helpful assistant.',
 * userMessage: 'Explain what web scraping is.',
 * });
 * console.log(response.content);
 */
async function chat({
  systemPrompt,
  userMessage,
  model = "gpt-5-mini",
}) {
  const client = getOpenAIClient();

  console.log(`[openai-service] Sending request to model ${model}...`);

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const choice = completion.choices?.[0];

  if (!choice) {
    throw new Error("[openai-service] No response returned by the API.");
  }

  console.log(
    `[openai-service] Response received. Tokens used: ${completion.usage?.total_tokens ?? "N/A"}`
  );

  return {
    content: choice.message?.content ?? "",
    usage: {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
    },
    model: completion.model,
  };
}

module.exports = { chat };