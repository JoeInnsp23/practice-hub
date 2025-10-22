/**
 * Mention Parser Service
 *
 * Handles parsing and highlighting of @mentions in task notes.
 * Supports format: @[User Name] for display and user IDs for storage.
 */

/**
 * Parse @mentions from text and extract mentioned usernames/names
 *
 * Supports two formats:
 * - @[User Name] - Preferred format with full name in brackets
 * - @username - Simple username format
 *
 * @param text - The text containing @mentions
 * @returns Array of mentioned names (without the @ symbol)
 *
 * @example
 * parseMentions("Hey @[John Doe], can you review this?")
 * // Returns: ["John Doe"]
 *
 * parseMentions("@john @mary please help")
 * // Returns: ["john", "mary"]
 */
export function parseMentions(text: string): string[] {
  // Parse @mentions in format @[User Name] or @username
  const mentionRegex = /@\[([^\]]+)\]|@(\w+)/g;
  const mentions: string[] = [];

  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    // Get captured group (either [1] for bracketed or [2] for username)
    const mention = match[1] || match[2];
    if (mention) {
      mentions.push(mention);
    }
  }

  return mentions;
}

/**
 * HTML-escape a string to prevent XSS attacks
 *
 * @param unsafe - String that may contain HTML special characters
 * @returns HTML-escaped string safe for innerHTML
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Highlight @mentions in text with styled spans for display
 *
 * Replaces @[User Name] with styled HTML spans containing the text-primary class.
 * SECURITY: Sanitizes user input by HTML-escaping mention content before injection.
 *
 * @param text - The text containing @mentions to highlight
 * @returns HTML string with highlighted mentions (sanitized against XSS)
 *
 * @example
 * highlightMentions("Hey @[John Doe], can you review?")
 * // Returns: 'Hey <span class="mention">@John Doe</span>, can you review?'
 *
 * @example XSS Protection
 * highlightMentions("@[<script>alert('XSS')</script>]")
 * // Returns: '<span class="mention">@&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;</span>'
 */
export function highlightMentions(text: string): string {
  // First, HTML-escape the entire text to prevent XSS
  const escapedText = escapeHtml(text);

  // Replace @mentions with styled spans (using already-escaped content)
  return escapedText.replace(
    /@\[([^\]]+)\]/g,
    '<span class="mention text-primary font-semibold">@$1</span>',
  );
}

/**
 * Extract user IDs from an array of user objects based on mentioned names
 *
 * This function maps mentioned names (extracted via parseMentions) to actual
 * user IDs from the tenant's user list. It performs case-insensitive matching
 * on full names.
 *
 * @param mentionedNames - Array of names extracted from @mentions
 * @param availableUsers - Array of user objects with id, firstName, and lastName
 * @returns Array of user IDs for matched mentions
 *
 * @example
 * const mentioned = parseMentions("@[John Doe] @[Jane Smith]");
 * const userIds = extractUserIds(mentioned, users);
 * // Returns: ["user-id-1", "user-id-2"]
 */
export function extractUserIds(
  mentionedNames: string[],
  availableUsers: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email?: string;
  }>,
): string[] {
  const userIds: string[] = [];

  for (const name of mentionedNames) {
    // Try to find user by full name (case-insensitive)
    const normalizedName = name.toLowerCase().trim();

    const matchedUser = availableUsers.find((user) => {
      const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().trim();
      const email = user.email?.toLowerCase() || "";

      // Match against full name or email
      return fullName === normalizedName || email === normalizedName;
    });

    if (matchedUser) {
      userIds.push(matchedUser.id);
    }
  }

  // Remove duplicates
  return [...new Set(userIds)];
}

/**
 * Format a user object for display in @mention autocomplete
 *
 * @param user - User object with name and email
 * @returns Formatted string for display
 *
 * @example
 * formatUserForMention({ firstName: "John", lastName: "Doe", email: "john@example.com" })
 * // Returns: "John Doe (john@example.com)"
 */
export function formatUserForMention(user: {
  firstName: string | null;
  lastName: string | null;
  email?: string;
}): string {
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return user.email ? `${name} (${user.email})` : name;
}

/**
 * Insert a mention at the cursor position in text
 *
 * @param text - Current text content
 * @param cursorPosition - Current cursor position in text
 * @param userName - Name to mention (will be formatted as @[Name])
 * @returns Object with new text and new cursor position
 *
 * @example
 * insertMention("Hello ", 6, "John Doe")
 * // Returns: { text: "Hello @[John Doe] ", cursorPosition: 17 }
 */
export function insertMention(
  text: string,
  cursorPosition: number,
  userName: string,
): { text: string; cursorPosition: number } {
  // Find the @ symbol position (search backwards from cursor)
  let atPosition = cursorPosition - 1;
  while (atPosition >= 0 && text[atPosition] !== "@") {
    atPosition--;
  }

  if (atPosition < 0) {
    // No @ found, append to end
    const mention = `@[${userName}] `;
    return {
      text: text + mention,
      cursorPosition: text.length + mention.length,
    };
  }

  // Replace from @ to cursor with formatted mention
  const beforeMention = text.slice(0, atPosition);
  const afterMention = text.slice(cursorPosition);
  const mention = `@[${userName}] `;
  const newText = beforeMention + mention + afterMention;

  return {
    text: newText,
    cursorPosition: atPosition + mention.length,
  };
}

/**
 * Check if cursor is in a mention context (after @ symbol)
 *
 * @param text - Current text content
 * @param cursorPosition - Current cursor position
 * @returns True if cursor is after @ symbol and before whitespace
 *
 * @example
 * isInMentionContext("Hello @jo", 9) // Returns: true
 * isInMentionContext("Hello @john ", 12) // Returns: false (space after mention)
 */
export function isInMentionContext(
  text: string,
  cursorPosition: number,
): boolean {
  // Search backwards from cursor to find @ symbol
  let atPosition = cursorPosition - 1;

  while (atPosition >= 0) {
    const char = text[atPosition];

    // If we hit whitespace before @, we're not in mention context
    if (char === " " || char === "\n") {
      return false;
    }

    // Found @ symbol - we're in mention context
    if (char === "@") {
      return true;
    }

    atPosition--;
  }

  return false;
}

/**
 * Extract partial mention query from text at cursor position
 *
 * Used for autocomplete to get the search query after @ symbol.
 *
 * @param text - Current text content
 * @param cursorPosition - Current cursor position
 * @returns The partial mention query (text after @ symbol)
 *
 * @example
 * getMentionQuery("Hello @jo", 9) // Returns: "jo"
 * getMentionQuery("Hello @", 7) // Returns: ""
 */
export function getMentionQuery(
  text: string,
  cursorPosition: number,
): string {
  // Search backwards from cursor to find @ symbol
  let atPosition = cursorPosition - 1;

  while (atPosition >= 0) {
    const char = text[atPosition];

    // If we hit whitespace before @, no mention query
    if (char === " " || char === "\n") {
      return "";
    }

    // Found @ symbol - extract query
    if (char === "@") {
      return text.slice(atPosition + 1, cursorPosition);
    }

    atPosition--;
  }

  return "";
}
