/**
 * Draws single-line centered text in a rectangle.
 */
export function drawCenteredText(page, text, { x, y, width, height, font, size = 12, color }) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const textHeight = font.heightAtSize(size);
  console.log("drawCenteredText")
  console.log(`y: ${y}`)

  const textX = x + (width - textWidth) / 2;
  const textY = y + (height - textHeight) / 2;

  page.drawText(text, {
    x: textX,
    y: textY,
    size,
    font,
    color,
  });
}

/**
 * Draws wrapped and horizontally centered text inside a rectangle,
 * and vertically centers the block of text.
 */
export function drawCenteredParagraph(page, text, { x, y, width, height, font, size = 12, lineHeight = 1.2, color }) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const actualLineHeight = size * lineHeight;
  const totalHeight = lines.length * actualLineHeight;
  let cursorY = y + (height - totalHeight) / 2 + (actualLineHeight * (lines.length - 1));

  for (let line of lines) {
    const lineWidth = font.widthOfTextAtSize(line, size);
    const lineX = x + (width - lineWidth) / 2;
    page.drawText(line, {
      x: lineX,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= actualLineHeight;
  }
}

/**
 * Draws left-aligned, wrapped text block vertically centered in a rectangle.
 */
export function drawLeftAlignedParagraph_Old(page, text, { x, y, width, height, font, size = 12, lineHeight = 1.2, color }) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const actualLineHeight = size * lineHeight;
  const totalHeight = lines.length * actualLineHeight;
  let cursorY = y + (height - totalHeight) / 2 + (actualLineHeight * (lines.length - 1));

  for (let line of lines) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= actualLineHeight;
  }
}


export function drawLeftAlignedParagraph(page, text, {
  x, y, width, height, font, size = 12, lineHeight = 1.2, color
}) {
  const rawLines = text.split(/\r?\n/); // support \n and \r\n
  const wrappedLines = [];

  for (const rawLine of rawLines) {
    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > width) {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
  }

  const actualLineHeight = size * lineHeight;
  const totalHeight = wrappedLines.length * actualLineHeight;
  let cursorY = y + (height - totalHeight) / 2 + (actualLineHeight * (wrappedLines.length - 1));

  for (const line of wrappedLines) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= actualLineHeight;
  }
}
/*
export function drawTopLeftAlignedParagraph(page, text, {
  x, y, width, height, font, size = 12, lineHeight = 1.2, color
}) {
  const rawLines = text.split(/\r?\n/);
  const wrappedLines = [];

  for (const rawLine of rawLines) {
    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > width) {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
  }

  const actualLineHeight = size * lineHeight;
  const maxLines = Math.floor(height / actualLineHeight);
  let cursorY = y + height - actualLineHeight;

  const linesToDraw = wrappedLines.slice(0, maxLines);

  // If we had to cut lines, add ellipsis to last line
  if (wrappedLines.length > maxLines && linesToDraw.length > 0) {
    let lastLine = linesToDraw[linesToDraw.length - 1];
    const ellipsisWidth = font.widthOfTextAtSize("...", size);
    let shortened = lastLine;

    while (font.widthOfTextAtSize(shortened, size) + ellipsisWidth > width && shortened.length > 0) {
      shortened = shortened.slice(0, -1);
    }

    linesToDraw[linesToDraw.length - 1] = `${shortened}...`;
  }

  for (const line of linesToDraw) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= actualLineHeight;
  }
}
*/

/**
 * Draw a top-left aligned paragraph inside a rectangle.
 * It tries to fit the text by shrinking the font in 0.5pt steps until it fits,
 * but never goes below `minSize`. If it still doesn't fit at min size,
 * it truncates with ellipsis on the last visible line.
 */
export function drawTopLeftAlignedParagraph(
  page,
  text,
  {
    x,
    y,
    width,
    height,
    font,
    size = 12,
    minSize = 7,
    step = 0.5,
    lineHeight = 1.2,
    color,
  }
) {
  // Helper: wrap a single raw line into multiple lines that fit `width`
  function wrapLine(raw, size) {
    const out = [];
    const words = raw.split(/\s+/);

    let cur = "";
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!w) continue;

      // If the word alone is wider than the box, hard-break it into chunks
      if (font.widthOfTextAtSize(w, size) > width) {
        // Flush current line if any
        if (cur) { out.push(cur); cur = ""; }
        // Break the long word into pieces that fit
        let piece = "";
        for (const ch of w) {
          const t = piece + ch;
          if (font.widthOfTextAtSize(t, size) > width) {
            if (piece) out.push(piece);
            piece = ch;
          } else {
            piece = t;
          }
        }
        if (piece) cur = piece; // start next line with remainder
        continue;
      }

      // Try to add the word to the current line
      const candidate = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        cur = candidate;
      } else {
        if (cur) out.push(cur);
        cur = w;
      }
    }
    if (cur) out.push(cur);
    return out;
  }

  // Helper: wrap a multi-line paragraph at a given font size
  function wrapParagraph(text, size) {
    const rawLines = text.split(/\r?\n/);
    const wrapped = [];
    for (const raw of rawLines) {
      if (raw === "") { wrapped.push(""); continue; }
      wrapped.push(...wrapLine(raw, size));
    }
    return wrapped;
  }

  // Try sizes: maxSize -> minSize in `step` decrements
  //  let size = maxSize;
  let wrappedLines = wrapParagraph(text, size);
  let fits = false;

  while (size >= minSize) {
    wrappedLines = wrapParagraph(text, size);
    const actualLineHeight = size * lineHeight;
    const neededHeight = wrappedLines.length * actualLineHeight;

    if (neededHeight <= height) {
      fits = true;
      break;
    }
    size = Math.round((size - step) * 2) / 2; // keep .0/.5 nicely
  }

  const actualLineHeight = size * lineHeight;
  const maxLines = Math.max(0, Math.floor(height / actualLineHeight));
  let linesToDraw = wrappedLines.slice(0, maxLines);

  // If we still don't fit at min size, ellipsize the last visible line
  if (!fits && linesToDraw.length > 0) {
    const ell = "...";
    const ellW = font.widthOfTextAtSize(ell, size);
    let last = linesToDraw[linesToDraw.length - 1];

    // Trim until last + "..." fits width
    while (last && font.widthOfTextAtSize(last, size) + ellW > width) {
      last = last.slice(0, -1);
    }
    linesToDraw[linesToDraw.length - 1] = (last ? last : "").trimEnd() + ell;
  }

  // Draw from top-left, going downward
  let cursorY = y + height - actualLineHeight;
  for (const line of linesToDraw) {
    page.drawText(line, {
      x,
      y: cursorY,
      size,
      font,
      color,
    });
    cursorY -= actualLineHeight;
  }

  return {
    usedFontSize: size,
    linesDrawn: linesToDraw.length,
    truncated: !fits,
  };
}


/**
 * Wraps text into display lines that fit within a given pixel width.
 * Handles explicit newlines as paragraph breaks (blank line → empty string in result).
 *
 * @param {string} text
 * @param {PDFFont} font
 * @param {number} size
 * @param {number} width - max line width in points
 * @returns {{ text: string, type: 'body'|'section'|'subhead'|'blank' }[]}
 */
export function wrapTextToLines(text, font, size, width) {
  const rawLines = text.split(/\r?\n/);
  const result = [];

  for (const raw of rawLines) {
    const sectionMatch = raw.match(/^===\s*(.+?)\s*===\s*$/);
    if (sectionMatch) {
      result.push({ text: sectionMatch[1].toUpperCase(), type: 'section' });
      continue;
    }
    const subheadMatch = raw.match(/^###\s*(.+?)\s*(?:###)?\s*$/);
    if (subheadMatch) {
      result.push({ text: subheadMatch[1], type: 'subhead' });
      continue;
    }
    const imageMatch = raw.match(/^IMAGE:(.+)$/);
    if (imageMatch) {
      result.push({ text: imageMatch[1], type: 'image' });
      continue;
    }
    if (raw.trim() === "") {
      result.push({ text: '', type: 'blank' });
      continue;
    }

    const words = raw.split(/\s+/).filter(Boolean);
    let cur = "";

    for (const w of words) {
      if (font.widthOfTextAtSize(w, size) > width) {
        if (cur) { result.push({ text: cur, type: 'body' }); cur = ""; }
        let piece = "";
        for (const ch of w) {
          const t = piece + ch;
          if (font.widthOfTextAtSize(t, size) > width) {
            if (piece) result.push({ text: piece, type: 'body' });
            piece = ch;
          } else {
            piece = t;
          }
        }
        if (piece) cur = piece;
        continue;
      }
      const candidate = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        cur = candidate;
      } else {
        if (cur) result.push({ text: cur, type: 'body' });
        cur = w;
      }
    }
    if (cur) result.push({ text: cur, type: 'body' });
  }

  return result;
}

/**
 * Draws pre-wrapped typed lines top-down inside a vertical band on a page.
 * Lines are objects { text, type } where type is 'body', 'section', 'subhead', or 'blank'.
 * Section and subhead lines render at larger sizes with extra spacing above them.
 * Stops when the next line would go below bottomY.
 *
 * @param {PDFPage} page
 * @param {{ text: string, type: string }[]} lines
 * @param {number} startIdx
 * @param {{ x, topY, bottomY, font, size, lineHeight, color, sectionSize?, subheadSize?, sectionColor? }} opts
 * @returns {number} index of the first line that did NOT fit
 */
export function drawLines(page, lines, startIdx, { x, topY, bottomY, font, size, lineHeight, color, sectionSize, subheadSize, sectionColor, embeddedImages, imageMaxHeight }) {
  const secSize  = sectionSize  ?? size * 1.25;
  const subSize  = subheadSize  ?? size * 1.1;
  const secColor = sectionColor ?? color;
  const lh = size * lineHeight;
  const imgMaxH  = imageMaxHeight ?? size * 4;

  let cursorY = topY;
  let idx = startIdx;

  while (idx < lines.length) {
    const { text, type } = lines[idx];

    if (type === 'image') {
      const pdfImg = embeddedImages?.get(text);
      if (!pdfImg) { idx++; continue; }
      const { width: iw, height: ih } = pdfImg.scale(1);
      const scale = Math.min(imgMaxH / ih, imgMaxH / iw);
      const dw = iw * scale, dh = ih * scale;
      if (cursorY - dh < bottomY) break;
      page.drawImage(pdfImg, { x, y: cursorY - dh, width: dw, height: dh });
      cursorY -= dh + lh * 0.2;
      idx++;
      continue;
    }

    let thisSize, thisColor, thisLh, gapAbove;
    if (type === 'section') {
      thisSize  = secSize;
      thisColor = secColor;
      thisLh    = secSize * lineHeight;
      gapAbove  = cursorY < topY ? lh * 0.5 : 0;
    } else if (type === 'subhead') {
      thisSize  = subSize;
      thisColor = color;
      thisLh    = subSize * lineHeight;
      gapAbove  = cursorY < topY ? lh * 0.25 : 0;
    } else {
      thisSize  = size;
      thisColor = color;
      thisLh    = lh;
      gapAbove  = 0;
    }

    if (cursorY - gapAbove - thisLh < bottomY) break;

    cursorY -= gapAbove + thisLh;

    if (type !== 'blank' && text !== '') {
      page.drawText(text, { x, y: cursorY, size: thisSize, font, color: thisColor });
    }

    idx++;
  }

  return idx;
}

export function asFoundryRoute(src) {
  if (!src) return src;

  // Already absolute or special URL schemes => don't touch
  if (/^(?:https?:)?\/\//i.test(src) || /^(?:data|blob):/i.test(src)) return src;

  // Ensure leading slash is fine either way; getRoute handles Foundry prefixes
  return foundry.utils.getRoute(src.startsWith("/") ? src.slice(1) : src);
}