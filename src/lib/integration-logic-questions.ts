import type { BusinessQuestion } from "./ai-specs-questions";

export const INTEGRATION_LOGIC_QUESTIONS: BusinessQuestion[] = [
  // ── HTTP Status Codes ────────────────────────────────────────────
  {
    id: "int-http-001",
    topic: "HTTP Status Codes",
    question: "What does HTTP status code 200 indicate?",
    options: ["Created", "OK - Request succeeded", "Redirect", "Bad Request"],
    answer: "OK - Request succeeded",
    explanation:
      "HTTP 200 is the standard response for a successful request. The response body typically contains the requested resource or result.",
  },
  {
    id: "int-http-002",
    topic: "HTTP Status Codes",
    question: "Which status code indicates a new resource was successfully created?",
    options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
    answer: "201 Created",
    explanation:
      "HTTP 201 Created is returned when a POST request successfully creates a new resource. The response usually includes the created resource and a Location header.",
  },
  {
    id: "int-http-003",
    topic: "HTTP Status Codes",
    question: "What does HTTP status code 429 mean?",
    options: [
      "Server Error",
      "Unauthorized",
      "Too Many Requests (rate limited)",
      "Request Timeout",
    ],
    answer: "Too Many Requests (rate limited)",
    explanation:
      "HTTP 429 indicates the client has sent too many requests in a given time window. The response usually includes a Retry-After header indicating how long to wait.",
  },
  {
    id: "int-http-004",
    topic: "HTTP Status Codes",
    question: "What is the difference between 401 and 403 status codes?",
    options: [
      "401 means bad request; 403 means not found",
      "401 means unauthenticated (no/invalid credentials); 403 means forbidden (authenticated but lacks permission)",
      "401 is for GET requests; 403 is for POST requests",
      "There is no difference; they are interchangeable",
    ],
    answer: "401 means unauthenticated (no/invalid credentials); 403 means forbidden (authenticated but lacks permission)",
    explanation:
      "401 Unauthorized means the request lacks valid authentication credentials. 403 Forbidden means the server understood the request and the client's identity, but the client does not have permission to access the resource.",
  },
  {
    id: "int-http-005",
    topic: "HTTP Status Codes",
    question: "Which status code indicates the server is temporarily unavailable, often due to maintenance?",
    options: ["500 Internal Server Error", "502 Bad Gateway", "503 Service Unavailable", "504 Gateway Timeout"],
    answer: "503 Service Unavailable",
    explanation:
      "HTTP 503 indicates the server is temporarily unable to handle requests, usually due to maintenance or overload. Unlike 500, it implies the issue is temporary.",
  },
  {
    id: "int-http-006",
    topic: "HTTP Status Codes",
    question: "A 301 status code means:",
    options: [
      "Temporary redirect - use the original URL next time",
      "Permanent redirect - the resource has moved to a new URL permanently",
      "The request requires authentication",
      "The resource was deleted",
    ],
    answer: "Permanent redirect - the resource has moved to a new URL permanently",
    explanation:
      "HTTP 301 Moved Permanently tells clients (and search engines) that the resource has permanently moved to the URL specified in the Location header. Future requests should use the new URL.",
  },

  // ── Webhook Concepts ─────────────────────────────────────────────
  {
    id: "int-wh-001",
    topic: "Webhook Concepts",
    question: "What is a webhook?",
    options: [
      "A type of database query",
      "An HTTP callback that delivers real-time data to a URL when an event occurs",
      "A JavaScript library for making API calls",
      "A tool for scraping websites",
    ],
    answer: "An HTTP callback that delivers real-time data to a URL when an event occurs",
    explanation:
      "Webhooks are event-driven HTTP POST requests sent from a source system to a configured URL when a specific event occurs (e.g., a payment is completed, a form is submitted). They enable real-time integrations without polling.",
  },
  {
    id: "int-wh-002",
    topic: "Webhook Concepts",
    question: "What is HMAC verification used for in webhooks?",
    options: [
      "Encrypting the webhook payload",
      "Verifying the webhook sender's identity by validating a signature hash",
      "Compressing the webhook data",
      "Routing webhooks to the correct endpoint",
    ],
    answer: "Verifying the webhook sender's identity by validating a signature hash",
    explanation:
      "HMAC (Hash-based Message Authentication Code) verification uses a shared secret to generate a signature hash of the payload. The receiver recomputes the hash and compares it to the signature header to confirm the webhook is authentic and untampered.",
  },
  {
    id: "int-wh-003",
    topic: "Webhook Concepts",
    question: "What should a webhook receiver return to acknowledge successful receipt?",
    options: [
      "HTTP 301 redirect",
      "HTTP 200 or 2xx status code within a timeout window",
      "HTTP 401 with authentication details",
      "The full processed result of the webhook data",
    ],
    answer: "HTTP 200 or 2xx status code within a timeout window",
    explanation:
      "Webhook senders expect a 2xx response (typically 200) within a few seconds. If no response or a non-2xx response is received, most systems will retry delivery according to an exponential backoff schedule.",
  },
  {
    id: "int-wh-004",
    topic: "Webhook Concepts",
    question: "Why should webhook handlers be idempotent?",
    options: [
      "To make them run faster",
      "Because the same event may be delivered multiple times due to retries",
      "To reduce server memory usage",
      "Because webhooks can only send data once",
    ],
    answer: "Because the same event may be delivered multiple times due to retries",
    explanation:
      "Network issues or timeouts can cause the sender to retry a webhook delivery. Idempotent handlers ensure that processing the same event multiple times produces the same result without duplication (e.g., by checking a unique event ID before processing).",
  },
  {
    id: "int-wh-005",
    topic: "Webhook Concepts",
    question: "What is the typical retry strategy for failed webhook deliveries?",
    options: [
      "No retries - fire and forget",
      "Retry once after 1 second",
      "Exponential backoff with a limited number of retries",
      "Infinite retries every 10 seconds",
    ],
    answer: "Exponential backoff with a limited number of retries",
    explanation:
      "Most webhook systems use exponential backoff (e.g., 1s, 2s, 4s, 8s, ...) with a retry limit (typically 3-10 attempts). After exhausting retries, the event is logged as failed and may need manual reprocessing.",
  },

  // ── Make.com / Zapier ────────────────────────────────────────────
  {
    id: "int-mz-001",
    topic: "Make.com / Zapier",
    question: "In Make.com, what is a 'scenario'?",
    options: [
      "A single API endpoint",
      "An automated workflow consisting of connected modules that process data",
      "A database table",
      "A user authentication flow",
    ],
    answer: "An automated workflow consisting of connected modules that process data",
    explanation:
      "A Make.com scenario is an automated workflow where modules (triggers, actions, transformers) are connected together. Data flows through the modules sequentially, similar to a visual programming pipeline.",
  },
  {
    id: "int-mz-002",
    topic: "Make.com / Zapier",
    question: "What is a 'Router' module in Make.com used for?",
    options: [
      "Connecting to a network router",
      "Splitting the scenario flow into multiple parallel paths based on conditions",
      "Routing emails to different inboxes",
      "Redirecting HTTP requests",
    ],
    answer: "Splitting the scenario flow into multiple parallel paths based on conditions",
    explanation:
      "A Router splits the data flow into multiple branches (routes). Each route can have a filter condition, allowing different processing paths based on the data. Similar to if/else logic in code.",
  },
  {
    id: "int-mz-003",
    topic: "Make.com / Zapier",
    question: "What does an 'Iterator' module do in Make.com?",
    options: [
      "Counts the number of items in a list",
      "Splits an array into individual bundles, processing each item separately",
      "Combines multiple items into a single output",
      "Filters out duplicate records",
    ],
    answer: "Splits an array into individual bundles, processing each item separately",
    explanation:
      "An Iterator takes an array (e.g., a list of line items from an invoice) and outputs each element as a separate bundle. This allows subsequent modules to process each item individually.",
  },
  {
    id: "int-mz-004",
    topic: "Make.com / Zapier",
    question: "In Zapier terminology, what is a 'Zap'?",
    options: [
      "A single API call",
      "An automated workflow with a trigger and one or more actions",
      "A database migration script",
      "A user interface component",
    ],
    answer: "An automated workflow with a trigger and one or more actions",
    explanation:
      "A Zap is Zapier's term for an automated workflow. Each Zap starts with a trigger (an event that starts the workflow) and includes one or more actions (tasks performed when the trigger fires).",
  },
  {
    id: "int-mz-005",
    topic: "Make.com / Zapier",
    question: "What is an 'Aggregator' module in Make.com?",
    options: [
      "A module that sends aggregated analytics",
      "A module that combines multiple bundles back into a single array or structure",
      "A module that deletes duplicate records",
      "A module that triggers scenarios on a schedule",
    ],
    answer: "A module that combines multiple bundles back into a single array or structure",
    explanation:
      "An Aggregator is the counterpart to an Iterator. It collects multiple individual bundles and merges them back into a single bundle containing an array. This is essential after iterating and transforming individual items.",
  },

  // ── OAuth2 Flows ─────────────────────────────────────────────────
  {
    id: "int-oa-001",
    topic: "OAuth2 Flows",
    question: "In OAuth2, what is the 'Authorization Code' flow used for?",
    options: [
      "Server-to-server authentication without user involvement",
      "User-facing apps where the user grants permission via a browser redirect",
      "IoT device authentication",
      "Generating API keys",
    ],
    answer: "User-facing apps where the user grants permission via a browser redirect",
    explanation:
      "The Authorization Code flow is the most common OAuth2 flow for web apps. The user is redirected to the authorization server, grants permission, and receives a one-time authorization code that is exchanged for access and refresh tokens.",
  },
  {
    id: "int-oa-002",
    topic: "OAuth2 Flows",
    question: "What is a 'refresh token' in OAuth2?",
    options: [
      "A token that refreshes the browser page",
      "A long-lived token used to obtain new access tokens without re-authenticating the user",
      "A token that resets the user's password",
      "A token used only during initial setup",
    ],
    answer: "A long-lived token used to obtain new access tokens without re-authenticating the user",
    explanation:
      "Refresh tokens have a longer lifespan than access tokens. When an access token expires, the application uses the refresh token to request a new access token without requiring the user to log in again.",
  },
  {
    id: "int-oa-003",
    topic: "OAuth2 Flows",
    question: "The 'Client Credentials' OAuth2 flow is designed for:",
    options: [
      "Mobile app users",
      "Machine-to-machine (M2M) authentication where no user is involved",
      "Social media login",
      "Two-factor authentication",
    ],
    answer: "Machine-to-machine (M2M) authentication where no user is involved",
    explanation:
      "The Client Credentials flow is used for server-to-server communication where the application authenticates itself (not a user) using its client ID and client secret. Common for backend services and cron jobs.",
  },
  {
    id: "int-oa-004",
    topic: "OAuth2 Flows",
    question: "What are 'scopes' in OAuth2?",
    options: [
      "Variable scoping rules in JavaScript",
      "Permissions that limit what an access token can do (e.g., read:email, write:repos)",
      "The geographic regions where the API is available",
      "Time limits on how long a token is valid",
    ],
    answer: "Permissions that limit what an access token can do (e.g., read:email, write:repos)",
    explanation:
      "Scopes define the specific permissions granted to an access token. They follow the principle of least privilege - apps should only request the scopes they need (e.g., 'read:user' instead of full account access).",
  },
  {
    id: "int-oa-005",
    topic: "OAuth2 Flows",
    question: "What is PKCE (Proof Key for Code Exchange) and when is it used?",
    options: [
      "A type of encryption algorithm",
      "A security extension for OAuth2 that prevents authorization code interception attacks, required for public clients",
      "A protocol for peer-to-peer communication",
      "A method for compressing API payloads",
    ],
    answer: "A security extension for OAuth2 that prevents authorization code interception attacks, required for public clients",
    explanation:
      "PKCE (pronounced 'pixy') adds a code_verifier/code_challenge pair to the Authorization Code flow. It prevents attackers from intercepting the authorization code, and is mandatory for public clients (SPAs, mobile apps) that cannot securely store a client secret.",
  },

  // ── Data Transformations ─────────────────────────────────────────
  {
    id: "int-dt-001",
    topic: "Data Transformations",
    question: "What does JSON.parse() do in JavaScript?",
    options: [
      "Converts a JavaScript object to a JSON string",
      "Converts a JSON string into a JavaScript object",
      "Validates whether a JSON string is syntactically correct",
      "Removes null values from a JSON object",
    ],
    answer: "Converts a JSON string into a JavaScript object",
    explanation:
      "JSON.parse() takes a valid JSON string and returns the corresponding JavaScript value (object, array, number, etc.). Its counterpart JSON.stringify() converts a JavaScript value to a JSON string.",
  },
  {
    id: "int-dt-002",
    topic: "Data Transformations",
    question: "In data transformations, what does array.map() do?",
    options: [
      "Filters out elements that don't match a condition",
      "Creates a new array by applying a function to each element of the original array",
      "Finds the first element matching a condition",
      "Sorts the array in ascending order",
    ],
    answer: "Creates a new array by applying a function to each element of the original array",
    explanation:
      "Array.map() transforms each element by applying a callback function, returning a new array of the same length. For example, items.map(i => i.name) extracts the name property from each item.",
  },
  {
    id: "int-dt-003",
    topic: "Data Transformations",
    question: "What is the ISO 8601 date format?",
    options: [
      "DD/MM/YYYY",
      "MM-DD-YYYY",
      "YYYY-MM-DDTHH:mm:ssZ",
      "Unix timestamp in seconds",
    ],
    answer: "YYYY-MM-DDTHH:mm:ssZ",
    explanation:
      "ISO 8601 (e.g., 2026-06-23T14:30:00Z) is the international standard for date/time representation. The 'T' separates date and time, and 'Z' indicates UTC. It is the preferred format for APIs because it is unambiguous.",
  },
  {
    id: "int-dt-004",
    topic: "Data Transformations",
    question: "What is 'dot notation' used for in no-code platforms like Make.com?",
    options: [
      "Creating file paths",
      "Accessing nested properties in JSON objects (e.g., body.data.user.email)",
      "Performing mathematical calculations",
      "Defining regular expressions",
    ],
    answer: "Accessing nested properties in JSON objects (e.g., body.data.user.email)",
    explanation:
      "Dot notation (e.g., body.data.user.email) navigates through nested JSON structures to access specific values. No-code platforms use this to map data between modules.",
  },
  {
    id: "int-dt-005",
    topic: "Data Transformations",
    question: "What does array.filter() return?",
    options: [
      "A boolean indicating if any element matches",
      "The first element that matches the condition",
      "A new array containing only elements that pass the test function",
      "The count of matching elements",
    ],
    answer: "A new array containing only elements that pass the test function",
    explanation:
      "Array.filter() creates a new array with all elements for which the callback function returns true. The original array is not modified. For example, items.filter(i => i.active) returns only active items.",
  },

  // ── API Design ───────────────────────────────────────────────────
  {
    id: "int-api-001",
    topic: "API Design",
    question: "What is the key difference between REST and GraphQL?",
    options: [
      "REST uses JSON; GraphQL uses XML",
      "REST has fixed endpoints returning predetermined data; GraphQL has a single endpoint where clients specify exactly what data they need",
      "REST is newer than GraphQL",
      "GraphQL can only read data; REST can read and write",
    ],
    answer: "REST has fixed endpoints returning predetermined data; GraphQL has a single endpoint where clients specify exactly what data they need",
    explanation:
      "REST uses multiple endpoints (e.g., /users, /users/1/posts) each returning fixed data structures. GraphQL uses a single endpoint where clients send a query specifying exactly which fields they need, reducing over-fetching and under-fetching.",
  },
  {
    id: "int-api-002",
    topic: "API Design",
    question: "What does 'idempotency' mean in API design?",
    options: [
      "The API can only be called once",
      "Making the same request multiple times produces the same result as making it once",
      "The API responds in under 100ms",
      "The API automatically retries failed requests",
    ],
    answer: "Making the same request multiple times produces the same result as making it once",
    explanation:
      "An idempotent operation produces the same outcome whether executed once or many times. GET, PUT, and DELETE are inherently idempotent. POST is typically not, but can be made idempotent using idempotency keys.",
  },
  {
    id: "int-api-003",
    topic: "API Design",
    question: "What is 'rate limiting' in APIs?",
    options: [
      "Limiting the size of API responses",
      "Restricting the number of API requests a client can make within a time window",
      "Limiting the number of users who can access the API",
      "Reducing the data transfer rate for large files",
    ],
    answer: "Restricting the number of API requests a client can make within a time window",
    explanation:
      "Rate limiting protects APIs from abuse and overload by capping requests per time period (e.g., 100 requests per minute). Exceeded limits return HTTP 429. Common headers include X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After.",
  },
  {
    id: "int-api-004",
    topic: "API Design",
    question: "What is cursor-based pagination?",
    options: [
      "Using a mouse cursor to navigate API responses",
      "Using an opaque token (cursor) to mark the position in a dataset for fetching the next page",
      "Paginating data alphabetically",
      "Loading all data at once and filtering on the client",
    ],
    answer: "Using an opaque token (cursor) to mark the position in a dataset for fetching the next page",
    explanation:
      "Cursor-based pagination uses a pointer (cursor) to the last item returned. The client sends this cursor to fetch the next page. Unlike offset-based pagination, it handles real-time data insertions/deletions without skipping or duplicating items.",
  },
  {
    id: "int-api-005",
    topic: "API Design",
    question: "Which HTTP method is used to partially update a resource?",
    options: ["GET", "POST", "PUT", "PATCH"],
    answer: "PATCH",
    explanation:
      "PATCH applies partial modifications to a resource (e.g., updating only the email field of a user). PUT replaces the entire resource, GET retrieves it, and POST creates a new resource.",
  },
];
