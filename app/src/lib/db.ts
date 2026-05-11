import Database from "better-sqlite3";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const DB_PATH = path.join(process.cwd(), "orbisloop.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        food_type TEXT NOT NULL,
        quantity TEXT NOT NULL,
        pickup_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_ngo_id TEXT,
        user_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (assigned_ngo_id) REFERENCES ngos(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS ngos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        capacity TEXT DEFAULT 'medium',
        total_assigned INTEGER NOT NULL DEFAULT 0,
        total_completed INTEGER NOT NULL DEFAULT 0,
        total_rejected INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ngo', 'supermarket')),
        phone TEXT,
        organization TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

// ── Submission types & functions ──

export interface Submission {
  id: string;
  business_name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  food_type: string;
  quantity: string;
  pickup_time: string;
  status: "pending" | "matched" | "completed";
  assigned_ngo_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface SubmissionWithNgo extends Submission {
  ngo_name: string | null;
  ngo_phone: string | null;
  ngo_reliability: number | null;
  ngo_distance_km: number | null;
}

export function createSubmission(data: {
  business_name: string;
  phone: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  food_type: string;
  quantity: string;
  pickup_time: string;
  user_id?: string | null;
}): Submission {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO submissions (id, business_name, phone, location, latitude, longitude, food_type, quantity, pickup_time, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.business_name, data.phone, data.location, data.latitude ?? null, data.longitude ?? null, data.food_type, data.quantity, data.pickup_time, data.user_id ?? null);
  return getSubmissionById(id)!;
}

export function getAllSubmissions(): Submission[] {
  const db = getDb();
  return db.prepare("SELECT * FROM submissions ORDER BY created_at DESC").all() as Submission[];
}

export function getSubmissionsByUserId(userId: string): Submission[] {
  const db = getDb();
  return db.prepare("SELECT * FROM submissions WHERE user_id = ? ORDER BY created_at DESC").all(userId) as Submission[];
}

export function getSubmissionsByNgoId(ngoId: string): Submission[] {
  const db = getDb();
  return db.prepare("SELECT * FROM submissions WHERE assigned_ngo_id = ? ORDER BY created_at DESC").all(ngoId) as Submission[];
}

export function getSubmissionById(id: string): Submission | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as Submission | undefined;
}

export function updateSubmission(id: string, data: { status?: string; assigned_ngo_id?: string | null }): Submission | undefined {
  const db = getDb();
  const existing = getSubmissionById(id);
  if (!existing) return undefined;

  const status = data.status ?? existing.status;
  const assigned_ngo_id = data.assigned_ngo_id !== undefined ? data.assigned_ngo_id : existing.assigned_ngo_id;

  db.prepare("UPDATE submissions SET status = ?, assigned_ngo_id = ? WHERE id = ?").run(status, assigned_ngo_id, id);
  return getSubmissionById(id);
}

// ── NGO types & functions ──

export interface Ngo {
  id: string;
  name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  capacity: string;
  total_assigned: number;
  total_completed: number;
  total_rejected: number;
  created_at: string;
}

export function createNgo(data: {
  name: string;
  phone: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: string;
}): Ngo {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO ngos (id, name, phone, location, latitude, longitude, capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.name, data.phone, data.location, data.latitude ?? null, data.longitude ?? null, data.capacity ?? "medium");
  return getNgoById(id)!;
}

export function getAllNgos(): Ngo[] {
  const db = getDb();
  return db.prepare("SELECT * FROM ngos ORDER BY name ASC").all() as Ngo[];
}

export function getNgoById(id: string): Ngo | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM ngos WHERE id = ?").get(id) as Ngo | undefined;
}

export function updateNgo(id: string, data: Partial<Pick<Ngo, "name" | "phone" | "location" | "latitude" | "longitude" | "capacity">>): Ngo | undefined {
  const db = getDb();
  const existing = getNgoById(id);
  if (!existing) return undefined;

  db.prepare(`
    UPDATE ngos SET name = ?, phone = ?, location = ?, latitude = ?, longitude = ?, capacity = ? WHERE id = ?
  `).run(
    data.name ?? existing.name,
    data.phone ?? existing.phone,
    data.location ?? existing.location,
    data.latitude !== undefined ? data.latitude : existing.latitude,
    data.longitude !== undefined ? data.longitude : existing.longitude,
    data.capacity ?? existing.capacity,
    id
  );
  return getNgoById(id);
}

export function incrementNgoAssigned(id: string) {
  const db = getDb();
  db.prepare("UPDATE ngos SET total_assigned = total_assigned + 1 WHERE id = ?").run(id);
}

export function incrementNgoCompleted(id: string) {
  const db = getDb();
  db.prepare("UPDATE ngos SET total_completed = total_completed + 1 WHERE id = ?").run(id);
}

export function incrementNgoRejected(id: string) {
  const db = getDb();
  db.prepare("UPDATE ngos SET total_rejected = total_rejected + 1 WHERE id = ?").run(id);
}

export function getNgoReliabilityScore(ngo: Ngo): number {
  const assigned = Number(ngo.total_assigned) || 0;
  const completed = Number(ngo.total_completed) || 0;
  if (assigned === 0) return 1.0; // new NGOs start with full trust
  return completed / assigned;
}

// ── User types & functions ──

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: "ngo" | "supermarket";
  phone: string | null;
  organization: string;
  created_at: string;
}

export function createUser(data: {
  email: string;
  password_hash: string;
  role: "ngo" | "supermarket";
  phone?: string;
  organization: string;
}): User {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, phone, organization)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, data.email, data.password_hash, data.role, data.phone ?? null, data.organization);
  return getUserById(id)!;
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function updateUser(id: string, data: { email?: string; phone?: string; organization?: string }): User | undefined {
  const db = getDb();
  const existing = getUserById(id);
  if (!existing) return undefined;
  db.prepare("UPDATE users SET email = ?, phone = ?, organization = ? WHERE id = ?").run(
    data.email ?? existing.email,
    data.phone ?? existing.phone,
    data.organization ?? existing.organization,
    id
  );
  return getUserById(id);
}

export function getNgoByUserId(userId: string): Ngo | undefined {
  const user = getUserById(userId);
  if (!user || user.role !== "ngo") return undefined;
  const db = getDb();
  return db.prepare("SELECT * FROM ngos WHERE phone = ?").get(user.phone) as Ngo | undefined;
}
