// Cursor pagination: the cursor encodes the (created_at, id) of the last item the client saw.
// Faster and more stable than OFFSET when new items keep arriving at the top of the feed.
export function encodeCursor(row) {
  return Buffer.from(`${row.created_at.toISOString()}|${row.id}`).toString('base64url');
}

export function decodeCursor(cursor) {
  if (!cursor) return null;
  const [createdAt, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  if (!createdAt || !id || Number.isNaN(Date.parse(createdAt))) return null;
  return { createdAt, id };
}
