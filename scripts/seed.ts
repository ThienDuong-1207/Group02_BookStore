/**
 * US-23 (GB-40): seed the database with demo accounts and ≥ 30 sample books.
 *
 *   npm run db:seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SEED_* from .env.local (see .env.example).
 * Uses the service-role key, so it bypasses RLS: run it only from a developer machine, never from the app.
 *
 * Idempotent (AC B2): running it again creates nothing new.
 *  - Demo users are looked up by email; existing ones are not re-created (only role/status are re-applied).
 *  - Categories and authors are matched by name (case-insensitive, like the unique indexes).
 *  - Books are matched by title + author; existing ones are skipped.
 */
import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { passwordSchema } from "../src/lib/validation/auth";
import { AUTHORS, BOOKS, CATEGORIES, coverUrl, seedCreatedAt } from "./seed-data";

type Role = "ADMIN" | "CUSTOMER";
type DemoUser = { email: string; password: string; fullName: string; role: Role };

// ---------------------------------------------------------------- config

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  return value;
}

function demoUser(prefix: "ADMIN" | "CUSTOMER", fullName: string): DemoUser {
  const email = requireEnv(`SEED_${prefix}_EMAIL`).toLowerCase();
  const password = requireEnv(`SEED_${prefix}_PASSWORD`);
  // Demo passwords must follow the same rules as registration (US-10 B1), otherwise the demo login looks broken.
  const check = passwordSchema.safeParse(password);
  if (!check.success) throw new Error(`SEED_${prefix}_PASSWORD: ${check.error.issues[0].message}`);
  return { email, password, fullName, role: prefix };
}

const key = (name: string) => name.trim().toLowerCase();

// ---------------------------------------------------------------- steps

async function seedUser(supabase: SupabaseClient, user: DemoUser): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", user.email)
    .maybeSingle<{ id: string }>();
  if (findError) throw findError;

  let id = existing?.id;
  if (id) {
    console.log(`  = ${user.email} already exists, not re-created`);
    // Make sure the demo account can log in, even if it was locked while testing US-14.
    const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: "none" });
    if (error) throw error;
  } else {
    // email_confirm: true → the account can log in immediately. The handle_new_user trigger creates the profile.
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName },
    });
    if (error) throw error;
    id = data.user.id;
    console.log(`  + ${user.email} created`);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: user.role, status: "ACTIVE", full_name: user.fullName })
    .eq("id", id);
  if (updateError) throw updateError;
  return id;
}

/** Inserts the names that do not exist yet; returns a map lower(name) → id for all of them. */
async function seedNames(supabase: SupabaseClient, table: "categories" | "authors", names: readonly string[]) {
  const { data: rows, error } = await supabase.from(table).select("id, name");
  if (error) throw error;

  const ids = new Map<string, string>((rows ?? []).map((row) => [key(row.name), row.id]));
  const missing = names.filter((name) => !ids.has(key(name)));

  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from(table)
      .insert(missing.map((name) => ({ name })))
      .select("id, name");
    if (insertError) throw insertError;
    for (const row of inserted ?? []) ids.set(key(row.name), row.id);
  }
  console.log(`  ${table}: ${missing.length} added, ${names.length - missing.length} already there`);
  return ids;
}

async function seedBooks(supabase: SupabaseClient, categoryIds: Map<string, string>, authorIds: Map<string, string>) {
  // Include soft-deleted rows, so a book deleted during testing is not inserted a second time.
  const { data: rows, error } = await supabase.from("books").select("title, author_id");
  if (error) throw error;
  const existing = new Set((rows ?? []).map((row) => `${key(row.title)}|${row.author_id}`));

  const toInsert = BOOKS.map((book, index) => ({ book, index }))
    .filter(({ book }) => !existing.has(`${key(book.title)}|${authorIds.get(key(book.author))}`))
    .map(({ book, index }) => ({
      title: book.title,
      description: book.description,
      price: book.price,
      stock: book.stock,
      cover_url: coverUrl(book.isbn),
      author_id: authorIds.get(key(book.author))!,
      category_id: categoryIds.get(key(book.category))!,
      created_at: seedCreatedAt(index), // AC B1: one day apart, oldest first
    }));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("books").insert(toInsert);
    if (insertError) throw insertError;
  }
  console.log(`  books: ${toInsert.length} added, ${BOOKS.length - toInsert.length} already there`);
}

async function printSummary(supabase: SupabaseClient) {
  const count = async (table: string) => {
    const { count: n, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) throw error;
    return n ?? 0;
  };
  const { count: soldOut, error } = await supabase
    .from("books_public")
    .select("*", { count: "exact", head: true })
    .eq("stock", 0);
  if (error) throw error;

  console.log("\nVisible to customers (books_public):");
  console.log(`  books: ${await count("books_public")} (sold out: ${soldOut ?? 0})`);
  console.log(`  categories: ${await count("categories")} · authors: ${await count("authors")}`);
}

// ---------------------------------------------------------------- main

async function main() {
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const users = [demoUser("ADMIN", "Demo Admin"), demoUser("CUSTOMER", "Demo Customer")];

  console.log("Demo accounts:");
  for (const user of users) await seedUser(supabase, user);

  console.log("Catalogue:");
  const categoryIds = await seedNames(supabase, "categories", CATEGORIES);
  const authorIds = await seedNames(supabase, "authors", AUTHORS);
  await seedBooks(supabase, categoryIds, authorIds);

  await printSummary(supabase);
  console.log("\nSeed finished.");
}

main().catch((error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
