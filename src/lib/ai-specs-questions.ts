export interface BusinessQuestion {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const AI_SPECS_QUESTIONS: BusinessQuestion[] = [
  // ── Context Windows ──────────────────────────────────────────────
  {
    id: "ai-cw-001",
    topic: "Context Windows",
    question: "What is the maximum context window of Gemini 2.5 Pro?",
    options: ["128K tokens", "200K tokens", "1M tokens", "2M tokens"],
    answer: "1M tokens",
    explanation:
      "Gemini 2.5 Pro supports up to 1 million tokens of context, making it one of the largest context windows available among frontier models.",
  },
  {
    id: "ai-cw-002",
    topic: "Context Windows",
    question: "Claude Sonnet 4 has a context window of:",
    options: ["100K tokens", "128K tokens", "200K tokens", "500K tokens"],
    answer: "200K tokens",
    explanation:
      "Claude Sonnet 4 supports a 200K token context window. This applies across the Claude 3.5/4 family of models from Anthropic.",
  },
  {
    id: "ai-cw-003",
    topic: "Context Windows",
    question: "What is GPT-4o's maximum context window?",
    options: ["32K tokens", "64K tokens", "128K tokens", "200K tokens"],
    answer: "128K tokens",
    explanation:
      "GPT-4o supports a 128K token context window (approximately 96,000 words), a significant increase from the original GPT-4's 8K/32K variants.",
  },
  {
    id: "ai-cw-004",
    topic: "Context Windows",
    question:
      "Which model has the LARGEST context window among these options?",
    options: ["GPT-4o", "Claude Sonnet 4", "Gemini 2.5 Pro", "Llama 3.1 405B"],
    answer: "Gemini 2.5 Pro",
    explanation:
      "Gemini 2.5 Pro leads with 1M tokens, followed by Claude Sonnet 4 at 200K, then GPT-4o and Llama 3.1 405B both at 128K.",
  },
  {
    id: "ai-cw-005",
    topic: "Context Windows",
    question:
      "Roughly how many pages of text can fit in a 128K token context window?",
    options: [
      "About 50 pages",
      "About 100 pages",
      "About 300 pages",
      "About 1,000 pages",
    ],
    answer: "About 300 pages",
    explanation:
      "A rough estimate is ~1.5 tokens per word and ~400 words per page, so 128K tokens is roughly 85,000 words or about 300 standard pages.",
  },
  {
    id: "ai-cw-006",
    topic: "Context Windows",
    question: "What is the context window of Meta's Llama 3.1 405B model?",
    options: ["8K tokens", "32K tokens", "128K tokens", "512K tokens"],
    answer: "128K tokens",
    explanation:
      "Llama 3.1 (all sizes including the 405B flagship) supports a 128K token context window, matching GPT-4o.",
  },

  // ── Token Pricing ────────────────────────────────────────────────
  {
    id: "ai-tp-001",
    topic: "Token Pricing",
    question:
      "Approximately how much does GPT-4o charge per 1M INPUT tokens (standard tier)?",
    options: ["$0.50", "$2.50", "$5.00", "$15.00"],
    answer: "$2.50",
    explanation:
      "GPT-4o charges approximately $2.50 per 1M input tokens. Output tokens are more expensive at around $10.00 per 1M.",
  },
  {
    id: "ai-tp-002",
    topic: "Token Pricing",
    question:
      "Which model generally has the LOWEST API pricing per token among these?",
    options: [
      "GPT-4o",
      "Claude Opus 4",
      "Gemini 2.5 Flash",
      "Claude Sonnet 4",
    ],
    answer: "Gemini 2.5 Flash",
    explanation:
      "Gemini 2.5 Flash is positioned as a cost-efficient model with input pricing around $0.15 per 1M tokens, significantly cheaper than GPT-4o or Claude Opus/Sonnet.",
  },
  {
    id: "ai-tp-003",
    topic: "Token Pricing",
    question:
      "Why are OUTPUT tokens typically more expensive than INPUT tokens?",
    options: [
      "Output uses more network bandwidth",
      "Output requires autoregressive generation, which is more compute-intensive",
      "Output tokens are always longer than input tokens",
      "API providers charge more as a convenience fee",
    ],
    answer: "Output requires autoregressive generation, which is more compute-intensive",
    explanation:
      "Input tokens are processed in parallel via the prefill stage, while output tokens must be generated one at a time (autoregressively), requiring significantly more GPU compute per token.",
  },
  {
    id: "ai-tp-004",
    topic: "Token Pricing",
    question:
      "Claude Opus 4 charges approximately how much per 1M INPUT tokens?",
    options: ["$3", "$10", "$15", "$30"],
    answer: "$15",
    explanation:
      "Claude Opus 4 is Anthropic's most capable and expensive model at approximately $15 per 1M input tokens and $75 per 1M output tokens.",
  },
  {
    id: "ai-tp-005",
    topic: "Token Pricing",
    question:
      "What is 'prompt caching' in the context of API pricing?",
    options: [
      "Storing prompts in a CDN for faster delivery",
      "Reusing KV-cache from repeated prefixes to reduce input costs",
      "Compressing prompts before sending to the API",
      "Caching API responses to avoid repeat calls",
    ],
    answer: "Reusing KV-cache from repeated prefixes to reduce input costs",
    explanation:
      "Prompt caching allows providers to reuse the key-value cache from previously processed prompt prefixes, offering significant discounts (often 50-90% off) on the cached portion of input tokens.",
  },

  // ── API Parameters ───────────────────────────────────────────────
  {
    id: "ai-ap-001",
    topic: "API Parameters",
    question: "What does a temperature of 0 do in LLM inference?",
    options: [
      "Produces random outputs",
      "Makes output nearly deterministic by always picking the highest-probability token",
      "Disables the model entirely",
      "Doubles the response length",
    ],
    answer: "Makes output nearly deterministic by always picking the highest-probability token",
    explanation:
      "Temperature 0 (or near-zero) makes the model greedily select the most probable token at each step, producing highly deterministic and focused outputs.",
  },
  {
    id: "ai-ap-002",
    topic: "API Parameters",
    question: "The 'top_p' parameter (nucleus sampling) controls:",
    options: [
      "The maximum number of tokens to generate",
      "The cumulative probability threshold for token selection",
      "The number of parallel API requests",
      "The speed of token generation",
    ],
    answer: "The cumulative probability threshold for token selection",
    explanation:
      "top_p (nucleus sampling) limits token selection to the smallest set of tokens whose cumulative probability exceeds the threshold p. For example, top_p=0.9 means only the top tokens summing to 90% probability are considered.",
  },
  {
    id: "ai-ap-003",
    topic: "API Parameters",
    question:
      "What is the typical valid range for the temperature parameter in OpenAI's API?",
    options: ["0 to 1", "0 to 2", "-1 to 1", "0 to 10"],
    answer: "0 to 2",
    explanation:
      "OpenAI's API accepts temperature values from 0 to 2. Values above 1 increase randomness significantly, while values below 1 make outputs more focused.",
  },
  {
    id: "ai-ap-004",
    topic: "API Parameters",
    question: "What does the 'max_tokens' parameter control?",
    options: [
      "Maximum tokens in the input prompt",
      "Maximum tokens the model will generate in its response",
      "Maximum tokens stored in the context window",
      "Maximum tokens per API call including input and output",
    ],
    answer: "Maximum tokens the model will generate in its response",
    explanation:
      "max_tokens (or max_completion_tokens) sets an upper limit on the number of tokens the model will generate in its response. It does not affect input processing.",
  },
  {
    id: "ai-ap-005",
    topic: "API Parameters",
    question:
      "What are 'stop sequences' used for in LLM API calls?",
    options: [
      "To stop the API server from processing requests",
      "To define strings that cause the model to stop generating further tokens",
      "To set rate limits on API calls",
      "To filter profanity from outputs",
    ],
    answer: "To define strings that cause the model to stop generating further tokens",
    explanation:
      "Stop sequences are strings (e.g., '\\n', '###', '</answer>') that, when generated by the model, cause it to immediately stop producing more tokens. This is useful for controlling output format.",
  },
  {
    id: "ai-ap-006",
    topic: "API Parameters",
    question:
      "The 'top_k' parameter limits token selection to:",
    options: [
      "The top k most probable tokens only",
      "Every k-th token in the vocabulary",
      "The first k tokens of the response",
      "k random tokens from the vocabulary",
    ],
    answer: "The top k most probable tokens only",
    explanation:
      "top_k restricts sampling to only the k highest-probability tokens. For example, top_k=40 means only the 40 most likely next tokens are considered. This parameter is used by Google's Gemini API and Anthropic's API but not directly by OpenAI.",
  },

  // ── RAG Architecture ─────────────────────────────────────────────
  {
    id: "ai-rag-001",
    topic: "RAG Architecture",
    question:
      "In RAG (Retrieval-Augmented Generation), what is the purpose of 'chunking'?",
    options: [
      "Compressing the LLM model weights",
      "Splitting documents into smaller segments for embedding and retrieval",
      "Dividing API calls into parallel requests",
      "Breaking the output into paginated responses",
    ],
    answer: "Splitting documents into smaller segments for embedding and retrieval",
    explanation:
      "Chunking splits source documents into smaller, semantically meaningful segments that can be individually embedded and retrieved. Common chunk sizes range from 256 to 1024 tokens with overlap.",
  },
  {
    id: "ai-rag-002",
    topic: "RAG Architecture",
    question:
      "What is the output dimension of OpenAI's text-embedding-3-large model?",
    options: ["384", "768", "1536", "3072"],
    answer: "3072",
    explanation:
      "OpenAI's text-embedding-3-large produces 3072-dimensional vectors by default. It also supports Matryoshka embeddings, allowing you to truncate to lower dimensions (e.g., 1536, 256) with minimal quality loss.",
  },
  {
    id: "ai-rag-003",
    topic: "RAG Architecture",
    question:
      "Which similarity metric is most commonly used for comparing normalized embedding vectors?",
    options: [
      "Euclidean distance",
      "Manhattan distance",
      "Cosine similarity",
      "Hamming distance",
    ],
    answer: "Cosine similarity",
    explanation:
      "Cosine similarity measures the angle between two vectors regardless of magnitude, making it ideal for comparing embedding vectors. For normalized vectors, cosine similarity and dot product produce identical rankings.",
  },
  {
    id: "ai-rag-004",
    topic: "RAG Architecture",
    question: "What is 'chunk overlap' and why is it used?",
    options: [
      "Repeating the entire document to improve recall",
      "Including shared tokens between adjacent chunks to preserve context at boundaries",
      "Running the same query against multiple vector stores",
      "Generating multiple embeddings for the same chunk",
    ],
    answer: "Including shared tokens between adjacent chunks to preserve context at boundaries",
    explanation:
      "Chunk overlap (typically 10-20% of chunk size) ensures that information at the boundary of two chunks isn't lost. For example, with 512-token chunks and 50-token overlap, the last 50 tokens of chunk N appear as the first 50 tokens of chunk N+1.",
  },
  {
    id: "ai-rag-005",
    topic: "RAG Architecture",
    question:
      "In a RAG pipeline, what role does a vector database (like Pinecone or pgvector) serve?",
    options: [
      "It runs the LLM inference",
      "It stores and performs similarity search over embedding vectors",
      "It handles user authentication",
      "It generates the text embeddings",
    ],
    answer: "It stores and performs similarity search over embedding vectors",
    explanation:
      "Vector databases store high-dimensional embedding vectors and provide efficient approximate nearest neighbor (ANN) search. They retrieve the most relevant chunks based on similarity to the query embedding.",
  },
  {
    id: "ai-rag-006",
    topic: "RAG Architecture",
    question:
      "What is 'hybrid search' in the context of RAG?",
    options: [
      "Using two different LLMs simultaneously",
      "Combining dense vector search with sparse keyword search (like BM25)",
      "Running RAG on both cloud and edge devices",
      "Searching across multiple languages at once",
    ],
    answer: "Combining dense vector search with sparse keyword search (like BM25)",
    explanation:
      "Hybrid search combines semantic (dense vector) retrieval with traditional keyword (sparse/BM25) retrieval. This catches both semantically similar and exact keyword matches, improving overall retrieval quality.",
  },

  // ── Model Capabilities ───────────────────────────────────────────
  {
    id: "ai-mc-001",
    topic: "Model Capabilities",
    question:
      "Which of the following models supports native tool/function calling?",
    options: [
      "GPT-4o, Claude Sonnet 4, and Gemini 2.5 Pro",
      "Only GPT-4o",
      "Only Claude Sonnet 4",
      "None of them - tool calling requires a wrapper library",
    ],
    answer: "GPT-4o, Claude Sonnet 4, and Gemini 2.5 Pro",
    explanation:
      "All three frontier models natively support tool/function calling through their APIs. Each has a slightly different schema format but the concept is the same: the model can output structured tool call requests.",
  },
  {
    id: "ai-mc-002",
    topic: "Model Capabilities",
    question:
      "Which feature allows an LLM to guarantee its output conforms to a specific JSON schema?",
    options: [
      "Temperature control",
      "Structured Output / JSON mode",
      "System instructions",
      "Stop sequences",
    ],
    answer: "Structured Output / JSON mode",
    explanation:
      "Structured Output (OpenAI) and JSON mode (Gemini) use constrained decoding to guarantee the model's output follows a specified JSON schema. This is more reliable than simply asking the model to output JSON in the prompt.",
  },
  {
    id: "ai-mc-003",
    topic: "Model Capabilities",
    question:
      "Which of these models can process images as input (vision capability)?",
    options: [
      "GPT-4o only",
      "GPT-4o and Gemini 2.5 Pro only",
      "GPT-4o, Claude Sonnet 4, and Gemini 2.5 Pro",
      "None - vision requires a separate model",
    ],
    answer: "GPT-4o, Claude Sonnet 4, and Gemini 2.5 Pro",
    explanation:
      "All three frontier models are multimodal and can process images as input. GPT-4o and Gemini can also handle video and audio inputs natively.",
  },
  {
    id: "ai-mc-004",
    topic: "Model Capabilities",
    question:
      "What is 'code execution' (or code interpreter) in the context of LLM APIs?",
    options: [
      "The model compiles and deploys production code",
      "The model can write and run code in a sandboxed environment to solve problems",
      "The model converts natural language to assembly code",
      "The model debugs your local development environment",
    ],
    answer: "The model can write and run code in a sandboxed environment to solve problems",
    explanation:
      "Code execution (available in Gemini and OpenAI's API) lets the model write Python code and execute it in a sandboxed container. This is useful for precise math, data analysis, and generating charts.",
  },
  {
    id: "ai-mc-005",
    topic: "Model Capabilities",
    question:
      "What does 'grounding' mean when using Gemini with Google Search?",
    options: [
      "Restricting the model to only use training data",
      "Connecting the model to real-time Google Search results to provide up-to-date answers",
      "Reducing hallucinations by lowering temperature",
      "Training the model on Google's internal data",
    ],
    answer: "Connecting the model to real-time Google Search results to provide up-to-date answers",
    explanation:
      "Grounding with Google Search is a Gemini API feature that lets the model query Google Search during inference, incorporating real-time web results into its answers with source citations.",
  },

  // ── Prompt Engineering ───────────────────────────────────────────
  {
    id: "ai-pe-001",
    topic: "Prompt Engineering",
    question: "What is 'few-shot prompting'?",
    options: [
      "Sending very short prompts to reduce token costs",
      "Providing a few input-output examples in the prompt to guide the model's behavior",
      "Making multiple API calls with different parameters",
      "Using a small model instead of a large one",
    ],
    answer: "Providing a few input-output examples in the prompt to guide the model's behavior",
    explanation:
      "Few-shot prompting includes 2-5 example input-output pairs in the prompt to demonstrate the desired format, tone, and reasoning pattern. Zero-shot uses no examples; many-shot uses many more.",
  },
  {
    id: "ai-pe-002",
    topic: "Prompt Engineering",
    question: "What is 'chain-of-thought' (CoT) prompting?",
    options: [
      "Chaining multiple API calls together",
      "Asking the model to show its step-by-step reasoning before giving a final answer",
      "Using multiple models in sequence",
      "Breaking a prompt into separate paragraphs",
    ],
    answer: "Asking the model to show its step-by-step reasoning before giving a final answer",
    explanation:
      "Chain-of-thought prompting instructs the model to reason through a problem step-by-step before providing an answer. This significantly improves accuracy on math, logic, and complex reasoning tasks.",
  },
  {
    id: "ai-pe-003",
    topic: "Prompt Engineering",
    question:
      "What is the purpose of a 'system prompt' (system instruction)?",
    options: [
      "To configure the server hosting the model",
      "To set the model's persona, behavior rules, and output constraints before the conversation begins",
      "To send error messages to the API",
      "To define the API endpoint URL",
    ],
    answer: "To set the model's persona, behavior rules, and output constraints before the conversation begins",
    explanation:
      "System prompts establish the model's role, constraints, and expected behavior. They are processed with elevated priority and persist across the conversation, unlike user messages.",
  },
  {
    id: "ai-pe-004",
    topic: "Prompt Engineering",
    question:
      "What technique involves giving the model a specific role or persona to improve output quality?",
    options: [
      "Temperature tuning",
      "Role prompting",
      "Batch inference",
      "Tokenization",
    ],
    answer: "Role prompting",
    explanation:
      "Role prompting (e.g., 'You are an expert data scientist...') primes the model to draw on relevant knowledge patterns and adopt an appropriate communication style for the task.",
  },
  {
    id: "ai-pe-005",
    topic: "Prompt Engineering",
    question:
      "What is the key difference between 'structured output' via prompting vs. via API-level enforcement?",
    options: [
      "There is no difference",
      "Prompting requests a format but the model can deviate; API enforcement guarantees schema compliance",
      "API enforcement is slower but prompting is faster",
      "Prompting works only with JSON; API enforcement works with any format",
    ],
    answer: "Prompting requests a format but the model can deviate; API enforcement guarantees schema compliance",
    explanation:
      "Prompt-based formatting relies on the model following instructions (which can fail). API-level structured output uses constrained decoding to guarantee every response is valid JSON matching the specified schema.",
  },
  {
    id: "ai-pe-006",
    topic: "Prompt Engineering",
    question:
      "What is 'prompt injection' and why is it a concern?",
    options: [
      "A performance optimization technique",
      "An attack where malicious input overrides the system prompt to make the model behave unexpectedly",
      "A method of compressing prompts to save tokens",
      "A way to inject code into the model's training data",
    ],
    answer: "An attack where malicious input overrides the system prompt to make the model behave unexpectedly",
    explanation:
      "Prompt injection is a security vulnerability where user input contains instructions that override or bypass the system prompt. Defenses include input sanitization, output validation, and using the model's system-level instructions with elevated priority.",
  },
];
