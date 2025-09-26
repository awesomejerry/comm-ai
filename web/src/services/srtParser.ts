/**
 * Parses SRT (SubRip) formatted text and extracts the subtitle text content
 * @param srtContent The SRT formatted string
 * @returns Plain text content from the subtitles
 */
export function parseSrtToText(srtContent: string): string {
  if (!srtContent || typeof srtContent !== 'string') {
    return '';
  }

  // Split by double newlines to get subtitle blocks
  const blocks = srtContent.split('\n\n');

  const texts: string[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');

    // Skip the subtitle number (first line) and timestamp (second line)
    // Extract text lines (third line onwards)
    if (lines.length >= 3) {
      const textLines = lines.slice(2);
      texts.push(textLines.join(' '));
    }
  }

  return texts.join(' ').trim();
}

/**
 * Validates if a string appears to be valid SRT format
 * @param content The string to validate
 * @returns True if it looks like SRT format
 */
export function isValidSrt(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Basic check: should have subtitle blocks with numbers and timestamps
  const blocks = content.split('\n\n');
  return blocks.some((block) => {
    const lines = block.trim().split('\n');
    return (
      lines.length >= 3 &&
      /^\d+$/.test(lines[0]) && // First line is a number
      /-->/.test(lines[1])
    ); // Second line has timestamp range
  });
}
