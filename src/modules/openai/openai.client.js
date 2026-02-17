const { OpenAI } = require("openai");

/**
 * Singleton instance of the OpenAI client.
 * @type {OpenAI | null}
 */
let instance = null;

/**
 * Returns a singleton instance of the OpenAI client.
 * If the instance does not exist, it initializes it using the API key from environment variables.
 * @returns {OpenAI}
 * @throws {Error} If the OPENAI_API_KEY environment variable is not set.
 */
function getOpenAIClient() {
  if (!instance) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "[openai] The OPENAI_API_KEY environment variable is not set. " +
          "Set it in the .env file or system environment variables."
      );
    }

    instance = new OpenAI({ apiKey });
  }

  return instance;
}

module.exports = { getOpenAIClient };
