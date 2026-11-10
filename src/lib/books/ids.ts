const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for a well-formed id, so a malformed one is answered without a query (PostgreSQL never sees it). */
export function isUuid(id: string): boolean {
  return UUID.test(id);
}
