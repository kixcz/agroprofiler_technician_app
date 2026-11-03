import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

export type SyncRecordStatus =
  | 'synced'
  | 'pending_sync'
  | 'syncing'
  | 'sync_failed'
  | 'conflict';

export interface LocalFarmer {
  id: string;
  server_id?: number | null;
  lfid: string;
  rsbsa_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  sex: string;
  birthdate: string;
  civil_status: string;
  mobile_number: string;
  email: string;
  barangay: string;
  purok: string;
  address: string;
  primary_commodity: string;
  farm_size: string;
  irrigation_type: string;
  land_tenure: string;
  is_4ps: boolean;
  is_ip: boolean;
  is_pwd: boolean;
  qr_code: string;
  qr_signature: string;
  registration_status: 'verified' | 'pending_review' | 'draft';
  sync_status: SyncRecordStatus;
  conflict_reason?: string | null;
  photo_uri?: string | null;
  updated_at: string;
  server_updated_at?: string | null;
}

export interface LocalFarm {
  id: string;
  server_id?: number | null;
  fid: string;
  farmer_id: string;
  farmer_lfid: string;
  farmer_name: string;
  name: string;
  barangay: string;
  total_area: number;
  tenure_type: string;
  soil_type: string;
  topography: string;
  irrigation_type: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy?: number | null;
  qr_code: string;
  sync_status: SyncRecordStatus;
  updated_at: string;
  parcels: LocalFarmParcel[];
}

export interface LocalFarmParcel {
  id: string;
  server_id?: number | null;
  fpid: string;
  farm_id: string;
  parcel_number: string;
  commodity: string;
  variety: string;
  area: number;
  latitude: number | null;
  longitude: number | null;
  qr_code: string;
  sync_status: SyncRecordStatus;
  updated_at: string;
}

export interface LocalCropMonitoringRecord {
  id: string;
  transaction_id: string;
  server_id?: number | null;
  farmer_id: string;
  farmer_name: string;
  farmer_lfid: string;
  farm_id: string;
  farm_name: string;
  parcel: string;
  commodity: string;
  variety: string;
  growth_stage: string;
  health_status: 'healthy' | 'stressed' | 'critical';
  issues: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  affected_area: string;
  affected_pct: string;
  weather_condition: string;
  temperature: string;
  humidity: string;
  wind_speed: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  gps_mocked: boolean;
  gps_exception_reason?: string | null;
  detected_barangay?: string | null;
  barangay_verified?: boolean;
  monitoring_status: 'Draft' | 'Ongoing' | 'Completed';
  entry_status: 'pending_review' | 'approved' | 'rejected';
  sync_status: SyncRecordStatus;
  conflict_reason?: string | null;
  photos_count: number;
  evidence_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface LocalDamageReport {
  id: string;
  server_id?: number | null;
  name: string;
  barangay: string;
  recorded_date: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  technician_id: string;
  technician_name: string;
  is_mine: boolean;
  sync_status: SyncRecordStatus;
  created_at: string;
}

export interface LocalDamageEntry {
  id: string;
  transaction_id: string;
  server_id?: number | null;
  report_id: string;
  farmer_id: string;
  farmer_name: string;
  lfid: string;
  farm_name: string;
  parcel_name: string;
  commodity: string;
  damage_type: string;
  severity: 'minor' | 'moderate' | 'severe';
  affected_area: string;
  affected_pct: string;
  estimated_loss: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  gps_mocked: boolean;
  gps_exception_reason?: string | null;
  detected_barangay?: string | null;
  barangay_verified?: boolean;
  status: 'pending_review' | 'verified' | 'rejected';
  sync_status: SyncRecordStatus;
  conflict_reason?: string | null;
  photos_count: number;
  evidence_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface LocalDistributionBatch {
  id: string;
  server_id?: number | null;
  program_id: string;
  title: string;
  commodity: string;
  unit: string;
  barangay: string;
  batch_no: string;
  total_stock: number;
  remaining_stock: number;
  total_farmers: number;
  served_farmers: number;
  status: 'open' | 'ongoing' | 'completed';
  release_date: string;
  sync_status: SyncRecordStatus;
  updated_at: string;
}

export interface LocalDistributionAllocation {
  id: string;
  transaction_id: string;
  server_id?: number | null;
  batch_id: string;
  farmer_id: string;
  farmer_name: string;
  lfid: string;
  rsbsa_number: string;
  barangay: string;
  allocated_qty: number;
  actual_qty: number;
  unit: string;
  lot_number: string;
  status: 'pending' | 'distributed' | 'cancelled' | 'conflict';
  qr_verified: boolean;
  secondary_verified: boolean;
  secondary_verification_method: string;
  signature_uri: string | null;
  acknowledgement_type: 'electronic_signature' | 'thumbmark_witnessed' | 'id_presented';
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  gps_mocked: boolean;
  gps_exception_reason?: string | null;
  detected_barangay?: string | null;
  barangay_verified?: boolean;
  remarks: string;
  distributed_by_id: string | null;
  distributed_by_name: string | null;
  distributed_at: string | null;
  evidence_ids: string[];
  sync_status: SyncRecordStatus;
  conflict_reason?: string | null;
  updated_at: string;
}

export interface FieldEvidenceRecord {
  evidence_id: string;
  transaction_id: string;
  activity_type:
    | 'farmer_registration'
    | 'farm_registration'
    | 'crop_monitoring'
    | 'crop_damage'
    | 'distribution';
  entity_id: string;
  technician_id: string;
  technician_name: string;
  farmer_id: string;
  farmer_lfid: string;
  farmer_name: string;
  farm_id: string;
  parcel_id: string;
  local_original_uri: string;
  remote_url: string | null;
  file_hash_sha256: string;
  file_size: number;
  mime_type: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  gps_timestamp: string | null;
  capture_timestamp: string;
  is_mock_location: boolean;
  is_stale_location: boolean;
  gps_exception_reason: string | null;
  gps_exception_notes: string | null;
  detected_barangay: string;
  barangay_verified: boolean;
  device_model: string;
  os_version: string;
  sync_status: SyncRecordStatus;
  server_receipt_at: string | null;
  verification_status: 'pending_review' | 'verified' | 'rejected';
  rejection_remarks: string | null;
}

export interface SyncQueueItem {
  operation_id: string;
  transaction_id: string;
  entity_type:
    | 'farmer'
    | 'farm'
    | 'farm_parcel'
    | 'crop_monitoring'
    | 'crop_damage'
    | 'allocation'
    | 'evidence';
  action_type: 'create' | 'update' | 'delete';
  entity_local_id: string;
  payload_json: string;
  media_ids_json: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  retry_count: number;
  max_retries: number;
  next_retry_at: number;
  last_error: string | null;
  conflict_data_json: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface LocalActivityLog {
  id: string;
  transaction_id: string;
  activity_type:
    | 'farmer_registration'
    | 'farm_registration'
    | 'crop_monitoring'
    | 'crop_damage'
    | 'distribution'
    | 'sync';
  title: string;
  subtitle: string;
  farmer_name: string;
  farmer_lfid: string;
  barangay: string;
  status: string;
  sync_status: SyncRecordStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  evidence_count: number;
  created_at: string;
}

export interface BarangayBoundary {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const VALIDATED_BARANGAY_BOUNDARIES: BarangayBoundary[] = [
  {
    name: 'Poblacion',
    centerLat: 7.3082,
    centerLng: 125.6842,
    radiusKm: 2.2,
    minLat: 7.295,
    maxLat: 7.320,
    minLng: 125.672,
    maxLng: 125.696,
  },
  {
    name: 'San Isidro',
    centerLat: 7.3265,
    centerLng: 125.6985,
    radiusKm: 2.8,
    minLat: 7.312,
    maxLat: 7.342,
    minLng: 125.684,
    maxLng: 125.712,
  },
  {
    name: 'Mabuhay',
    centerLat: 7.2895,
    centerLng: 125.6690,
    radiusKm: 2.6,
    minLat: 7.274,
    maxLat: 7.304,
    minLng: 125.654,
    maxLng: 125.684,
  },
  {
    name: 'Maligaya',
    centerLat: 7.3450,
    centerLng: 125.6710,
    radiusKm: 2.8,
    minLat: 7.330,
    maxLat: 7.360,
    minLng: 125.656,
    maxLng: 125.686,
  },
  {
    name: 'Bagong Silang',
    centerLat: 7.2980,
    centerLng: 125.7150,
    radiusKm: 2.8,
    minLat: 7.282,
    maxLat: 7.314,
    minLng: 125.700,
    maxLng: 125.730,
  },
  {
    name: 'Santa Cruz',
    centerLat: 7.3180,
    centerLng: 125.6520,
    radiusKm: 2.6,
    minLat: 7.303,
    maxLat: 7.333,
    minLng: 125.637,
    maxLng: 125.667,
  },
];

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

// Change listeners so UI screens automatically refresh when SQLite data or sync state changes
type DbListener = () => void;
const dbListeners = new Set<DbListener>();

export function subscribeDatabaseChanges(listener: DbListener): () => void {
  dbListeners.add(listener);
  return () => {
    dbListeners.delete(listener);
  };
}

export function notifyDatabaseChanges(): void {
  dbListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('DB listener error:', e);
    }
  });
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  if (dbInstance) {
    return dbInstance;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync('agroprofiler_offline_v2.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS kv_store (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farmers (
          id TEXT PRIMARY KEY NOT NULL,
          server_id INTEGER,
          lfid TEXT NOT NULL,
          rsbsa_number TEXT NOT NULL,
          first_name TEXT NOT NULL,
          middle_name TEXT DEFAULT '',
          last_name TEXT NOT NULL,
          suffix TEXT DEFAULT '',
          sex TEXT DEFAULT 'Male',
          birthdate TEXT DEFAULT '1980-05-14',
          civil_status TEXT DEFAULT 'Married',
          mobile_number TEXT DEFAULT '',
          email TEXT DEFAULT '',
          barangay TEXT NOT NULL,
          purok TEXT DEFAULT '',
          address TEXT DEFAULT '',
          primary_commodity TEXT DEFAULT 'Rice',
          farm_size TEXT DEFAULT '1.5',
          irrigation_type TEXT DEFAULT 'Irrigated',
          land_tenure TEXT DEFAULT 'Owner',
          is_4ps INTEGER DEFAULT 0,
          is_ip INTEGER DEFAULT 0,
          is_pwd INTEGER DEFAULT 0,
          qr_code TEXT NOT NULL,
          qr_signature TEXT DEFAULT '',
          registration_status TEXT DEFAULT 'verified',
          sync_status TEXT DEFAULT 'synced',
          conflict_reason TEXT,
          photo_uri TEXT,
          updated_at TEXT NOT NULL,
          server_updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS farms (
          id TEXT PRIMARY KEY NOT NULL,
          server_id INTEGER,
          fid TEXT NOT NULL,
          farmer_id TEXT NOT NULL,
          farmer_lfid TEXT NOT NULL,
          farmer_name TEXT NOT NULL,
          name TEXT NOT NULL,
          barangay TEXT NOT NULL,
          total_area REAL DEFAULT 0,
          tenure_type TEXT DEFAULT 'Owner',
          soil_type TEXT DEFAULT 'Clay Loam',
          topography TEXT DEFAULT 'Flat / Plain',
          irrigation_type TEXT DEFAULT 'Irrigated (NIA)',
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          qr_code TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced',
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS farm_parcels (
          id TEXT PRIMARY KEY NOT NULL,
          server_id INTEGER,
          fpid TEXT NOT NULL,
          farm_id TEXT NOT NULL,
          parcel_number TEXT NOT NULL,
          commodity TEXT NOT NULL,
          variety TEXT DEFAULT '',
          area REAL DEFAULT 0,
          latitude REAL,
          longitude REAL,
          qr_code TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced',
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS crop_monitoring_records (
          id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL UNIQUE,
          server_id INTEGER,
          farmer_id TEXT NOT NULL,
          farmer_name TEXT NOT NULL,
          farmer_lfid TEXT NOT NULL,
          farm_id TEXT NOT NULL,
          farm_name TEXT NOT NULL,
          parcel TEXT NOT NULL,
          commodity TEXT NOT NULL,
          variety TEXT DEFAULT '',
          growth_stage TEXT NOT NULL,
          health_status TEXT NOT NULL,
          issues_json TEXT DEFAULT '[]',
          severity TEXT DEFAULT 'none',
          affected_area TEXT DEFAULT '0',
          affected_pct TEXT DEFAULT '0',
          weather_condition TEXT DEFAULT 'Sunny',
          temperature TEXT DEFAULT '31',
          humidity TEXT DEFAULT '72',
          wind_speed TEXT DEFAULT '10',
          notes TEXT DEFAULT '',
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          gps_mocked INTEGER DEFAULT 0,
          gps_exception_reason TEXT,
          detected_barangay TEXT,
          barangay_verified INTEGER DEFAULT 0,
          monitoring_status TEXT DEFAULT 'Ongoing',
          entry_status TEXT DEFAULT 'pending_review',
          sync_status TEXT DEFAULT 'pending_sync',
          conflict_reason TEXT,
          photos_count INTEGER DEFAULT 0,
          evidence_ids_json TEXT DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS crop_damage_reports (
          id TEXT PRIMARY KEY NOT NULL,
          server_id INTEGER,
          name TEXT NOT NULL,
          barangay TEXT NOT NULL,
          recorded_date TEXT NOT NULL,
          status TEXT DEFAULT 'submitted',
          technician_id TEXT NOT NULL,
          technician_name TEXT NOT NULL,
          is_mine INTEGER DEFAULT 1,
          sync_status TEXT DEFAULT 'synced',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS crop_damage_entries (
          id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL UNIQUE,
          server_id INTEGER,
          report_id TEXT NOT NULL,
          farmer_id TEXT NOT NULL,
          farmer_name TEXT NOT NULL,
          lfid TEXT NOT NULL,
          farm_name TEXT NOT NULL,
          parcel_name TEXT NOT NULL,
          commodity TEXT NOT NULL,
          damage_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          affected_area TEXT NOT NULL,
          affected_pct TEXT NOT NULL,
          estimated_loss TEXT NOT NULL,
          notes TEXT DEFAULT '',
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          gps_mocked INTEGER DEFAULT 0,
          gps_exception_reason TEXT,
          detected_barangay TEXT,
          barangay_verified INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending_review',
          sync_status TEXT DEFAULT 'pending_sync',
          conflict_reason TEXT,
          photos_count INTEGER DEFAULT 0,
          evidence_ids_json TEXT DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS distribution_batches (
          id TEXT PRIMARY KEY NOT NULL,
          server_id INTEGER,
          program_id TEXT NOT NULL,
          title TEXT NOT NULL,
          commodity TEXT NOT NULL,
          unit TEXT NOT NULL,
          barangay TEXT NOT NULL,
          batch_no TEXT NOT NULL,
          total_stock REAL NOT NULL,
          remaining_stock REAL NOT NULL,
          total_farmers INTEGER NOT NULL,
          served_farmers INTEGER NOT NULL,
          status TEXT DEFAULT 'ongoing',
          release_date TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced',
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS distribution_allocations (
          id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL,
          server_id INTEGER,
          batch_id TEXT NOT NULL,
          farmer_id TEXT NOT NULL,
          farmer_name TEXT NOT NULL,
          lfid TEXT NOT NULL,
          rsbsa_number TEXT DEFAULT '',
          barangay TEXT NOT NULL,
          allocated_qty REAL NOT NULL,
          actual_qty REAL NOT NULL,
          unit TEXT NOT NULL,
          lot_number TEXT DEFAULT '',
          status TEXT DEFAULT 'pending',
          qr_verified INTEGER DEFAULT 0,
          secondary_verified INTEGER DEFAULT 0,
          secondary_verification_method TEXT DEFAULT '',
          signature_uri TEXT,
          acknowledgement_type TEXT DEFAULT 'electronic_signature',
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          gps_mocked INTEGER DEFAULT 0,
          gps_exception_reason TEXT,
          detected_barangay TEXT,
          barangay_verified INTEGER DEFAULT 0,
          remarks TEXT DEFAULT '',
          distributed_by_id TEXT,
          distributed_by_name TEXT,
          distributed_at TEXT,
          evidence_ids_json TEXT DEFAULT '[]',
          sync_status TEXT DEFAULT 'synced',
          conflict_reason TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS field_evidence (
          evidence_id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          technician_id TEXT NOT NULL,
          technician_name TEXT NOT NULL,
          farmer_id TEXT DEFAULT '',
          farmer_lfid TEXT DEFAULT '',
          farmer_name TEXT DEFAULT '',
          farm_id TEXT DEFAULT '',
          parcel_id TEXT DEFAULT '',
          local_original_uri TEXT NOT NULL,
          remote_url TEXT,
          file_hash_sha256 TEXT NOT NULL,
          file_size INTEGER DEFAULT 0,
          mime_type TEXT DEFAULT 'image/jpeg',
          latitude REAL,
          longitude REAL,
          accuracy REAL,
          altitude REAL,
          gps_timestamp TEXT,
          capture_timestamp TEXT NOT NULL,
          is_mock_location INTEGER DEFAULT 0,
          is_stale_location INTEGER DEFAULT 0,
          gps_exception_reason TEXT,
          gps_exception_notes TEXT,
          detected_barangay TEXT DEFAULT '',
          barangay_verified INTEGER DEFAULT 0,
          device_model TEXT DEFAULT '',
          os_version TEXT DEFAULT '',
          sync_status TEXT DEFAULT 'pending_sync',
          server_receipt_at TEXT,
          verification_status TEXT DEFAULT 'pending_review',
          rejection_remarks TEXT
        );

        CREATE TABLE IF NOT EXISTS sync_queue (
          operation_id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          action_type TEXT NOT NULL,
          entity_local_id TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          media_ids_json TEXT DEFAULT '[]',
          status TEXT DEFAULT 'pending',
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 5,
          next_retry_at INTEGER DEFAULT 0,
          last_error TEXT,
          conflict_data_json TEXT,
          created_at TEXT NOT NULL,
          synced_at TEXT
        );

        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY NOT NULL,
          transaction_id TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          title TEXT NOT NULL,
          subtitle TEXT NOT NULL,
          farmer_name TEXT DEFAULT '',
          farmer_lfid TEXT DEFAULT '',
          barangay TEXT DEFAULT '',
          status TEXT DEFAULT '',
          sync_status TEXT DEFAULT 'synced',
          latitude REAL,
          longitude REAL,
          accuracy REAL,
          evidence_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reference_data (
          category TEXT NOT NULL,
          item_key TEXT NOT NULL,
          name TEXT NOT NULL,
          parent_key TEXT DEFAULT '',
          metadata_json TEXT DEFAULT '{}',
          PRIMARY KEY (category, item_key)
        );
      `);

      dbInstance = db;
      await seedInitialDataIfEmpty(db);
      return db;
    } catch (error) {
      console.error('Failed to open or initialize SQLite database:', error);
      return null;
    }
  })();

  return initPromise;
}

async function seedInitialDataIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM farmers'
  );
  if (existing && existing.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  // Seed initial assigned farmers
  const initialFarmers: LocalFarmer[] = [
    {
      id: 'farmer-1',
      server_id: 101,
      lfid: 'LFID-2026-001',
      rsbsa_number: '11-23-04-001-000101',
      first_name: 'Juan',
      middle_name: 'Santos',
      last_name: 'Dela Cruz',
      suffix: 'Sr.',
      sex: 'Male',
      birthdate: '1975-03-18',
      civil_status: 'Married',
      mobile_number: '09171234567',
      email: 'juan.delacruz@agro.ph',
      barangay: 'Poblacion',
      purok: 'Purok 2',
      address: 'Purok 2, Brgy. Poblacion',
      primary_commodity: 'Rice',
      farm_size: '2.5',
      irrigation_type: 'Irrigated',
      land_tenure: 'Owner',
      is_4ps: true,
      is_ip: false,
      is_pwd: false,
      qr_code: 'AGROQR:v1:LFID-2026-001:11-23-04-001-000101:SIG8891A',
      qr_signature: 'SIG8891A',
      registration_status: 'verified',
      sync_status: 'synced',
      updated_at: now,
    },
    {
      id: 'farmer-2',
      server_id: 102,
      lfid: 'LFID-2026-002',
      rsbsa_number: '11-23-04-002-000102',
      first_name: 'Maria',
      middle_name: 'Reyes',
      last_name: 'Santos',
      suffix: '',
      sex: 'Female',
      birthdate: '1982-09-22',
      civil_status: 'Married',
      mobile_number: '09182345678',
      email: 'maria.santos@agro.ph',
      barangay: 'San Isidro',
      purok: 'Purok 4',
      address: 'Purok 4, Brgy. San Isidro',
      primary_commodity: 'Corn',
      farm_size: '1.8',
      irrigation_type: 'Rainfed',
      land_tenure: 'Tenant',
      is_4ps: true,
      is_ip: false,
      is_pwd: false,
      qr_code: 'AGROQR:v1:LFID-2026-002:11-23-04-002-000102:SIG4420B',
      qr_signature: 'SIG4420B',
      registration_status: 'verified',
      sync_status: 'synced',
      updated_at: now,
    },
    {
      id: 'farmer-3',
      server_id: 103,
      lfid: 'LFID-2026-003',
      rsbsa_number: '11-23-04-003-000103',
      first_name: 'Pedro',
      middle_name: 'Gomez',
      last_name: 'Reyes',
      suffix: '',
      sex: 'Male',
      birthdate: '1969-11-05',
      civil_status: 'Married',
      mobile_number: '09193456789',
      email: '',
      barangay: 'Mabuhay',
      purok: 'Purok 1',
      address: 'Purok 1, Brgy. Mabuhay',
      primary_commodity: 'Vegetables',
      farm_size: '1.2',
      irrigation_type: 'Irrigated',
      land_tenure: 'Owner',
      is_4ps: false,
      is_ip: true,
      is_pwd: false,
      qr_code: 'AGROQR:v1:LFID-2026-003:11-23-04-003-000103:SIG7712C',
      qr_signature: 'SIG7712C',
      registration_status: 'verified',
      sync_status: 'synced',
      updated_at: now,
    },
    {
      id: 'farmer-4',
      server_id: 104,
      lfid: 'LFID-2026-004',
      rsbsa_number: '11-23-04-004-000104',
      first_name: 'Rosa',
      middle_name: 'Lopez',
      last_name: 'Mendoza',
      suffix: '',
      sex: 'Female',
      birthdate: '1988-06-12',
      civil_status: 'Single',
      mobile_number: '09204567890',
      email: '',
      barangay: 'Maligaya',
      purok: 'Purok 3',
      address: 'Purok 3, Brgy. Maligaya',
      primary_commodity: 'Rice',
      farm_size: '3.0',
      irrigation_type: 'Irrigated',
      land_tenure: 'Owner',
      is_4ps: false,
      is_ip: false,
      is_pwd: true,
      qr_code: 'AGROQR:v1:LFID-2026-004:11-23-04-004-000104:SIG1059D',
      qr_signature: 'SIG1059D',
      registration_status: 'verified',
      sync_status: 'synced',
      updated_at: now,
    },
    {
      id: 'farmer-5',
      server_id: 105,
      lfid: 'LFID-2026-005',
      rsbsa_number: '11-23-04-005-000105',
      first_name: 'Roberto',
      middle_name: 'Diaz',
      last_name: 'Garcia',
      suffix: 'Jr.',
      sex: 'Male',
      birthdate: '1978-01-30',
      civil_status: 'Married',
      mobile_number: '09215678901',
      email: '',
      barangay: 'Bagong Silang',
      purok: 'Purok 5',
      address: 'Purok 5, Brgy. Bagong Silang',
      primary_commodity: 'Coconut',
      farm_size: '4.2',
      irrigation_type: 'Rainfed',
      land_tenure: 'Leaseholder',
      is_4ps: true,
      is_ip: false,
      is_pwd: false,
      qr_code: 'AGROQR:v1:LFID-2026-005:11-23-04-005-000105:SIG3994E',
      qr_signature: 'SIG3994E',
      registration_status: 'verified',
      sync_status: 'synced',
      updated_at: now,
    },
    {
      id: 'farmer-6',
      server_id: 106,
      lfid: 'LFID-2026-006',
      rsbsa_number: '11-23-04-006-000106',
      first_name: 'Elena',
      middle_name: 'Cruz',
      last_name: 'Villanueva',
      suffix: '',
      sex: 'Female',
      birthdate: '1985-04-19',
      civil_status: 'Married',
      mobile_number: '09226789012',
      email: '',
      barangay: 'Poblacion',
      purok: 'Purok 1',
      address: 'Purok 1, Brgy. Poblacion',
      primary_commodity: 'Rice',
      farm_size: '2.0',
      irrigation_type: 'Irrigated',
      land_tenure: 'Owner',
      is_4ps: false,
      is_ip: false,
      is_pwd: false,
      qr_code: 'AGROQR:v1:LFID-2026-006:11-23-04-006-000106:SIG6128F',
      qr_signature: 'SIG6128F',
      registration_status: 'verified',
      sync_status: 'synced',
      updated_at: now,
    },
  ];

  for (const f of initialFarmers) {
    await db.runAsync(
      `INSERT OR IGNORE INTO farmers (
        id, server_id, lfid, rsbsa_number, first_name, middle_name, last_name, suffix,
        sex, birthdate, civil_status, mobile_number, email, barangay, purok, address,
        primary_commodity, farm_size, irrigation_type, land_tenure, is_4ps, is_ip, is_pwd,
        qr_code, qr_signature, registration_status, sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        f.id,
        f.server_id ?? null,
        f.lfid,
        f.rsbsa_number,
        f.first_name,
        f.middle_name,
        f.last_name,
        f.suffix,
        f.sex,
        f.birthdate,
        f.civil_status,
        f.mobile_number,
        f.email,
        f.barangay,
        f.purok,
        f.address,
        f.primary_commodity,
        f.farm_size,
        f.irrigation_type,
        f.land_tenure,
        f.is_4ps ? 1 : 0,
        f.is_ip ? 1 : 0,
        f.is_pwd ? 1 : 0,
        f.qr_code,
        f.qr_signature,
        f.registration_status,
        f.sync_status,
        f.updated_at,
      ]
    );
  }

  // Seed Farms & Parcels
  const farmsSeed = [
    {
      id: 'farm-1',
      fid: 'FID-2026-001',
      farmer_id: 'farmer-1',
      farmer_lfid: 'LFID-2026-001',
      farmer_name: 'Juan Dela Cruz',
      name: 'Dela Cruz Main Riceland',
      barangay: 'Poblacion',
      total_area: 2.5,
      tenure_type: 'Owner',
      soil_type: 'Clay Loam',
      topography: 'Flat / Plain',
      irrigation_type: 'Irrigated (NIA)',
      latitude: 7.3085,
      longitude: 125.6845,
      qr_code: 'AGROQR:v1:FID-2026-001',
      parcels: [
        {
          id: 'parcel-1',
          fpid: 'FPID-2026-001A',
          parcel_number: 'Parcel 1 (North Block)',
          commodity: 'Rice',
          variety: 'NSIC Rc 222',
          area: 1.5,
          latitude: 7.3086,
          longitude: 125.6846,
        },
        {
          id: 'parcel-2',
          fpid: 'FPID-2026-001B',
          parcel_number: 'Parcel 2 (South Block)',
          commodity: 'Rice',
          variety: 'NSIC Rc 160',
          area: 1.0,
          latitude: 7.3081,
          longitude: 125.6841,
        },
      ],
    },
    {
      id: 'farm-2',
      fid: 'FID-2026-002',
      farmer_id: 'farmer-2',
      farmer_lfid: 'LFID-2026-002',
      farmer_name: 'Maria Santos',
      name: 'Santos Cornfield Upper',
      barangay: 'San Isidro',
      total_area: 1.8,
      tenure_type: 'Tenant',
      soil_type: 'Sandy Loam',
      topography: 'Rolling',
      irrigation_type: 'Rainfed',
      latitude: 7.3268,
      longitude: 125.6982,
      qr_code: 'AGROQR:v1:FID-2026-002',
      parcels: [
        {
          id: 'parcel-3',
          fpid: 'FPID-2026-002A',
          parcel_number: 'Parcel 1 (East Slope)',
          commodity: 'Corn',
          variety: 'Pioneer P3585',
          area: 1.8,
          latitude: 7.3268,
          longitude: 125.6982,
        },
      ],
    },
    {
      id: 'farm-3',
      fid: 'FID-2026-003',
      farmer_id: 'farmer-3',
      farmer_lfid: 'LFID-2026-003',
      farmer_name: 'Pedro Reyes',
      name: 'Reyes Vegetable Garden',
      barangay: 'Mabuhay',
      total_area: 1.2,
      tenure_type: 'Owner',
      soil_type: 'Silt Loam',
      topography: 'Flat / Plain',
      irrigation_type: 'Pump / Deep Well',
      latitude: 7.2898,
      longitude: 125.6693,
      qr_code: 'AGROQR:v1:FID-2026-003',
      parcels: [
        {
          id: 'parcel-4',
          fpid: 'FPID-2026-003A',
          parcel_number: 'Parcel 1 (High Value Veg)',
          commodity: 'Vegetables',
          variety: 'Eggplant Casino F1',
          area: 1.2,
          latitude: 7.2898,
          longitude: 125.6693,
        },
      ],
    },
  ];

  for (const farm of farmsSeed) {
    await db.runAsync(
      `INSERT OR IGNORE INTO farms (
        id, fid, farmer_id, farmer_lfid, farmer_name, name, barangay, total_area,
        tenure_type, soil_type, topography, irrigation_type, latitude, longitude,
        qr_code, sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [
        farm.id,
        farm.fid,
        farm.farmer_id,
        farm.farmer_lfid,
        farm.farmer_name,
        farm.name,
        farm.barangay,
        farm.total_area,
        farm.tenure_type,
        farm.soil_type,
        farm.topography,
        farm.irrigation_type,
        farm.latitude,
        farm.longitude,
        farm.qr_code,
        now,
      ]
    );

    for (const p of farm.parcels) {
      await db.runAsync(
        `INSERT OR IGNORE INTO farm_parcels (
          id, fpid, farm_id, parcel_number, commodity, variety, area,
          latitude, longitude, qr_code, sync_status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
        [
          p.id,
          p.fpid,
          farm.id,
          p.parcel_number,
          p.commodity,
          p.variety,
          p.area,
          p.latitude,
          p.longitude,
          `AGROQR:v1:${p.fpid}`,
          now,
        ]
      );
    }
  }

  // Seed Crop Monitoring Records
  await db.runAsync(
    `INSERT OR IGNORE INTO crop_monitoring_records (
      id, transaction_id, farmer_id, farmer_name, farmer_lfid, farm_id, farm_name,
      parcel, commodity, variety, growth_stage, health_status, issues_json, severity,
      affected_area, affected_pct, weather_condition, temperature, humidity, wind_speed,
      notes, latitude, longitude, gps_accuracy, gps_mocked, detected_barangay, barangay_verified,
      monitoring_status, entry_status, sync_status, photos_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'mon-1',
      'TX-MON-2026-0001',
      'farmer-1',
      'Juan Dela Cruz',
      'LFID-2026-001',
      'farm-1',
      'Dela Cruz Main Riceland',
      'Parcel 1 (North Block)',
      'Rice',
      'NSIC Rc 222',
      'Vegetative',
      'healthy',
      '[]',
      'none',
      '0',
      '0',
      'Sunny',
      '31',
      '74',
      '8',
      'Uniform tillering observed across North Block; irrigation canal water level optimal.',
      7.3086,
      125.6846,
      4.2,
      0,
      'Poblacion',
      1,
      'Ongoing',
      'approved',
      'synced',
      2,
      now,
      now,
    ]
  );

  // Seed Crop Damage Reports & Entries
  await db.runAsync(
    `INSERT OR IGNORE INTO crop_damage_reports (
      id, name, barangay, recorded_date, status, technician_id, technician_name, is_mine, sync_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [
      'dmg-rep-1',
      'Typhoon Aghon Flash Flood Assessment',
      'San Isidro',
      '2026-10-28',
      'submitted',
      'tech-1',
      'Engr. Marco Reyes',
      1,
      now,
    ]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO crop_damage_entries (
      id, transaction_id, report_id, farmer_id, farmer_name, lfid, farm_name, parcel_name,
      commodity, damage_type, severity, affected_area, affected_pct, estimated_loss, notes,
      latitude, longitude, gps_accuracy, gps_mocked, detected_barangay, barangay_verified,
      status, sync_status, photos_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'dmg-ent-1',
      'TX-DMG-2026-0001',
      'dmg-rep-1',
      'farmer-2',
      'Maria Santos',
      'LFID-2026-002',
      'Santos Cornfield Upper',
      'Parcel 1 (East Slope)',
      'Corn',
      'Flood / Lodging',
      'moderate',
      '0.75',
      '42',
      '24500',
      'Stalk lodging along lower drainage channel after heavy overnight rainfall.',
      7.3268,
      125.6982,
      5.1,
      0,
      'San Isidro',
      1,
      'verified',
      'synced',
      3,
      now,
      now,
    ]
  );

  // Seed Distribution Batches & Approved Beneficiaries
  await db.runAsync(
    `INSERT OR IGNORE INTO distribution_batches (
      id, program_id, title, commodity, unit, barangay, batch_no, total_stock,
      remaining_stock, total_farmers, served_farmers, status, release_date, sync_status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [
      'batch-1',
      'prog-rcef-2026',
      'RCEF Certified Inbred Rice Seeds (Wet Season)',
      'Certified Rice Seeds (NSIC Rc 222)',
      'bags (20kg)',
      'Poblacion',
      'BATCH-RCEF-2026-01',
      120,
      96,
      6,
      1,
      'ongoing',
      '2026-11-03',
      now,
    ]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO distribution_batches (
      id, program_id, title, commodity, unit, barangay, batch_no, total_stock,
      remaining_stock, total_farmers, served_farmers, status, release_date, sync_status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
    [
      'batch-2',
      'prog-fert-2026',
      'DA Complete Fertilizer & Urea Assistance',
      'Urea Fertilizer (46-0-0)',
      'sacks (50kg)',
      'San Isidro',
      'BATCH-FERT-2026-04',
      80,
      80,
      4,
      0,
      'open',
      '2026-11-04',
      now,
    ]
  );

  const allocationsSeed = [
    {
      id: 'alloc-1',
      transaction_id: 'TX-DIST-2026-0001',
      batch_id: 'batch-1',
      farmer_id: 'farmer-1',
      farmer_name: 'Juan Dela Cruz',
      lfid: 'LFID-2026-001',
      rsbsa_number: '11-23-04-001-000101',
      barangay: 'Poblacion',
      allocated_qty: 5,
      actual_qty: 5,
      unit: 'bags (20kg)',
      lot_number: 'LOT-RC222-88A',
      status: 'pending',
    },
    {
      id: 'alloc-2',
      transaction_id: 'TX-DIST-2026-0002',
      batch_id: 'batch-1',
      farmer_id: 'farmer-6',
      farmer_name: 'Elena Villanueva',
      lfid: 'LFID-2026-006',
      rsbsa_number: '11-23-04-006-000106',
      barangay: 'Poblacion',
      allocated_qty: 4,
      actual_qty: 4,
      unit: 'bags (20kg)',
      lot_number: 'LOT-RC222-88A',
      status: 'distributed',
    },
    {
      id: 'alloc-3',
      transaction_id: 'TX-DIST-2026-0003',
      batch_id: 'batch-1',
      farmer_id: 'farmer-3',
      farmer_name: 'Pedro Reyes',
      lfid: 'LFID-2026-003',
      rsbsa_number: '11-23-04-003-000103',
      barangay: 'Mabuhay',
      allocated_qty: 3,
      actual_qty: 3,
      unit: 'bags (20kg)',
      lot_number: 'LOT-RC222-88A',
      status: 'pending',
    },
    {
      id: 'alloc-4',
      transaction_id: 'TX-DIST-2026-0004',
      batch_id: 'batch-1',
      farmer_id: 'farmer-4',
      farmer_name: 'Rosa Mendoza',
      lfid: 'LFID-2026-004',
      rsbsa_number: '11-23-04-004-000104',
      barangay: 'Maligaya',
      allocated_qty: 6,
      actual_qty: 6,
      unit: 'bags (20kg)',
      lot_number: 'LOT-RC222-88A',
      status: 'pending',
    },
    {
      id: 'alloc-5',
      transaction_id: 'TX-DIST-2026-0005',
      batch_id: 'batch-2',
      farmer_id: 'farmer-2',
      farmer_name: 'Maria Santos',
      lfid: 'LFID-2026-002',
      rsbsa_number: '11-23-04-002-000102',
      barangay: 'San Isidro',
      allocated_qty: 4,
      actual_qty: 4,
      unit: 'sacks (50kg)',
      lot_number: 'LOT-UREA-19C',
      status: 'pending',
    },
    {
      id: 'alloc-6',
      transaction_id: 'TX-DIST-2026-0006',
      batch_id: 'batch-2',
      farmer_id: 'farmer-5',
      farmer_name: 'Roberto Garcia',
      lfid: 'LFID-2026-005',
      rsbsa_number: '11-23-04-005-000105',
      barangay: 'Bagong Silang',
      allocated_qty: 6,
      actual_qty: 6,
      unit: 'sacks (50kg)',
      lot_number: 'LOT-UREA-19C',
      status: 'pending',
    },
  ];

  for (const a of allocationsSeed) {
    await db.runAsync(
      `INSERT OR IGNORE INTO distribution_allocations (
        id, transaction_id, batch_id, farmer_id, farmer_name, lfid, rsbsa_number,
        barangay, allocated_qty, actual_qty, unit, lot_number, status, qr_verified,
        secondary_verified, sync_status, distributed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
      [
        a.id,
        a.transaction_id,
        a.batch_id,
        a.farmer_id,
        a.farmer_name,
        a.lfid,
        a.rsbsa_number,
        a.barangay,
        a.allocated_qty,
        a.actual_qty,
        a.unit,
        a.lot_number,
        a.status,
        a.status === 'distributed' ? 1 : 0,
        a.status === 'distributed' ? 1 : 0,
        a.status === 'distributed' ? now : null,
        now,
      ]
    );
  }

  // Seed Activity Logs
  await db.runAsync(
    `INSERT OR IGNORE INTO activity_logs (
      id, transaction_id, activity_type, title, subtitle, farmer_name, farmer_lfid,
      barangay, status, sync_status, latitude, longitude, accuracy, evidence_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?, ?, ?)`,
    [
      'act-1',
      'TX-MON-2026-0001',
      'crop_monitoring',
      'Crop Monitoring Inspection',
      'Rice (NSIC Rc 222) — Vegetative Stage • Healthy',
      'Juan Dela Cruz',
      'LFID-2026-001',
      'Poblacion',
      'Approved',
      7.3086,
      125.6846,
      4.2,
      2,
      now,
    ]
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO activity_logs (
      id, transaction_id, activity_type, title, subtitle, farmer_name, farmer_lfid,
      barangay, status, sync_status, latitude, longitude, accuracy, evidence_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?, ?, ?)`,
    [
      'act-2',
      'TX-DIST-2026-0002',
      'distribution',
      'QR Assistance Released (4 bags)',
      'RCEF Certified Inbred Rice Seeds • LOT-RC222-88A',
      'Elena Villanueva',
      'LFID-2026-006',
      'Poblacion',
      'Distributed',
      7.3082,
      125.6842,
      3.8,
      1,
      now,
    ]
  );
}

// ============================================================================
// CRUD & Query Helpers
// ============================================================================

export async function getAllFarmers(): Promise<LocalFarmer[]> {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM farmers ORDER BY updated_at DESC'
  );
  return rows.map(mapRowToFarmer);
}

export async function getFarmerByIdOrLfid(idOrLfid: string): Promise<LocalFarmer | null> {
  const db = await getDatabase();
  if (!db) return null;
  const clean = idOrLfid.trim();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM farmers WHERE id = ? OR UPPER(lfid) = UPPER(?) OR UPPER(rsbsa_number) = UPPER(?) LIMIT 1',
    [clean, clean, clean]
  );
  return row ? mapRowToFarmer(row) : null;
}

function mapRowToFarmer(row: any): LocalFarmer {
  return {
    id: row.id,
    server_id: row.server_id,
    lfid: row.lfid,
    rsbsa_number: row.rsbsa_number,
    first_name: row.first_name,
    middle_name: row.middle_name || '',
    last_name: row.last_name,
    suffix: row.suffix || '',
    sex: row.sex || 'Male',
    birthdate: row.birthdate || '1980-05-14',
    civil_status: row.civil_status || 'Married',
    mobile_number: row.mobile_number || '',
    email: row.email || '',
    barangay: row.barangay,
    purok: row.purok || '',
    address: row.address || '',
    primary_commodity: row.primary_commodity || 'Rice',
    farm_size: String(row.farm_size || '1.0'),
    irrigation_type: row.irrigation_type || 'Irrigated',
    land_tenure: row.land_tenure || 'Owner',
    is_4ps: Boolean(row.is_4ps),
    is_ip: Boolean(row.is_ip),
    is_pwd: Boolean(row.is_pwd),
    qr_code: row.qr_code,
    qr_signature: row.qr_signature || '',
    registration_status: row.registration_status || 'verified',
    sync_status: row.sync_status || 'synced',
    conflict_reason: row.conflict_reason,
    photo_uri: row.photo_uri,
    updated_at: row.updated_at,
    server_updated_at: row.server_updated_at,
  };
}

export async function saveFarmerOffline(
  farmer: Omit<LocalFarmer, 'id' | 'lfid' | 'qr_code' | 'qr_signature' | 'sync_status' | 'updated_at'> & {
    id?: string;
    lfid?: string;
    evidenceIds?: string[];
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
  }
): Promise<LocalFarmer> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = farmer.id || `farmer-${Date.now()}`;
  const randomSeq = Math.floor(100 + Math.random() * 900);
  const lfid = farmer.lfid || `LFID-2026-${randomSeq}`;
  const sig = `SIG${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const qrCode = `AGROQR:v1:${lfid}:${farmer.rsbsa_number}:${sig}`;
  const txId = `TX-FRM-${Date.now()}`;

  const record: LocalFarmer = {
    id,
    lfid,
    rsbsa_number: farmer.rsbsa_number,
    first_name: farmer.first_name,
    middle_name: farmer.middle_name || '',
    last_name: farmer.last_name,
    suffix: farmer.suffix || '',
    sex: farmer.sex,
    birthdate: farmer.birthdate,
    civil_status: farmer.civil_status,
    mobile_number: farmer.mobile_number,
    email: farmer.email || '',
    barangay: farmer.barangay,
    purok: farmer.purok,
    address: farmer.address || `${farmer.purok}, Brgy. ${farmer.barangay}`,
    primary_commodity: farmer.primary_commodity,
    farm_size: farmer.farm_size,
    irrigation_type: farmer.irrigation_type,
    land_tenure: farmer.land_tenure,
    is_4ps: farmer.is_4ps,
    is_ip: farmer.is_ip,
    is_pwd: farmer.is_pwd,
    qr_code: qrCode,
    qr_signature: sig,
    registration_status: 'pending_review',
    sync_status: 'pending_sync',
    photo_uri: farmer.photo_uri || null,
    updated_at: now,
  };

  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO farmers (
        id, lfid, rsbsa_number, first_name, middle_name, last_name, suffix,
        sex, birthdate, civil_status, mobile_number, email, barangay, purok, address,
        primary_commodity, farm_size, irrigation_type, land_tenure, is_4ps, is_ip, is_pwd,
        qr_code, qr_signature, registration_status, sync_status, photo_uri, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.lfid,
        record.rsbsa_number,
        record.first_name,
        record.middle_name,
        record.last_name,
        record.suffix,
        record.sex,
        record.birthdate,
        record.civil_status,
        record.mobile_number,
        record.email,
        record.barangay,
        record.purok,
        record.address,
        record.primary_commodity,
        record.farm_size,
        record.irrigation_type,
        record.land_tenure,
        record.is_4ps ? 1 : 0,
        record.is_ip ? 1 : 0,
        record.is_pwd ? 1 : 0,
        record.qr_code,
        record.qr_signature,
        record.registration_status,
        record.sync_status,
        record.photo_uri ?? null,
        record.updated_at,
      ]
    );

    await enqueueSyncOperation(db, {
      transaction_id: txId,
      entity_type: 'farmer',
      action_type: 'create',
      entity_local_id: record.id,
      payload: {
        ...record,
        latitude: farmer.latitude ?? null,
        longitude: farmer.longitude ?? null,
        accuracy: farmer.accuracy ?? null,
      },
      media_ids: farmer.evidenceIds || [],
    });

    await insertActivityLog(db, {
      transaction_id: txId,
      activity_type: 'farmer_registration',
      title: 'Farmer Registration Queued',
      subtitle: `${record.first_name} ${record.last_name} (${record.lfid}) • ${record.primary_commodity}`,
      farmer_name: `${record.first_name} ${record.last_name}`,
      farmer_lfid: record.lfid,
      barangay: record.barangay,
      status: 'Pending Review',
      sync_status: 'pending_sync',
      latitude: farmer.latitude ?? null,
      longitude: farmer.longitude ?? null,
      accuracy: farmer.accuracy ?? null,
      evidence_count: farmer.evidenceIds?.length || 0,
    });
  }

  notifyDatabaseChanges();
  return record;
}

export async function getAllFarms(): Promise<LocalFarm[]> {
  const db = await getDatabase();
  if (!db) return [];
  const farmsRows = await db.getAllAsync<any>('SELECT * FROM farms ORDER BY updated_at DESC');
  const parcelsRows = await db.getAllAsync<any>('SELECT * FROM farm_parcels ORDER BY parcel_number ASC');

  return farmsRows.map((f) => ({
    id: f.id,
    server_id: f.server_id,
    fid: f.fid,
    farmer_id: f.farmer_id,
    farmer_lfid: f.farmer_lfid,
    farmer_name: f.farmer_name,
    name: f.name,
    barangay: f.barangay,
    total_area: Number(f.total_area || 0),
    tenure_type: f.tenure_type,
    soil_type: f.soil_type,
    topography: f.topography,
    irrigation_type: f.irrigation_type,
    latitude: f.latitude,
    longitude: f.longitude,
    gps_accuracy: f.gps_accuracy,
    qr_code: f.qr_code,
    sync_status: f.sync_status || 'synced',
    updated_at: f.updated_at,
    parcels: parcelsRows
      .filter((p) => p.farm_id === f.id)
      .map((p) => ({
        id: p.id,
        server_id: p.server_id,
        fpid: p.fpid,
        farm_id: p.farm_id,
        parcel_number: p.parcel_number,
        commodity: p.commodity,
        variety: p.variety || '',
        area: Number(p.area || 0),
        latitude: p.latitude,
        longitude: p.longitude,
        qr_code: p.qr_code,
        sync_status: p.sync_status || 'synced',
        updated_at: p.updated_at,
      })),
  }));
}

export async function saveFarmOffline(input: {
  farmer_id: string;
  farmer_lfid: string;
  farmer_name: string;
  name: string;
  barangay: string;
  total_area: number;
  tenure_type: string;
  soil_type: string;
  topography: string;
  irrigation_type: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy?: number | null;
  parcels: Array<{
    parcel_number: string;
    commodity: string;
    variety: string;
    area: number;
    latitude: number | null;
    longitude: number | null;
  }>;
  evidenceIds?: string[];
}): Promise<LocalFarm> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `farm-${Date.now()}`;
  const fid = `FID-2026-${Math.floor(100 + Math.random() * 900)}`;
  const qrCode = `AGROQR:v1:${fid}`;
  const txId = `TX-FARM-${Date.now()}`;

  const savedParcels: LocalFarmParcel[] = input.parcels.map((p, idx) => {
    const fpid = `${fid}-P${idx + 1}`;
    return {
      id: `${id}-p${idx + 1}`,
      fpid,
      farm_id: id,
      parcel_number: p.parcel_number,
      commodity: p.commodity,
      variety: p.variety,
      area: p.area,
      latitude: p.latitude ?? input.latitude,
      longitude: p.longitude ?? input.longitude,
      qr_code: `AGROQR:v1:${fpid}`,
      sync_status: 'pending_sync',
      updated_at: now,
    };
  });

  const farmRecord: LocalFarm = {
    id,
    fid,
    farmer_id: input.farmer_id,
    farmer_lfid: input.farmer_lfid,
    farmer_name: input.farmer_name,
    name: input.name,
    barangay: input.barangay,
    total_area: input.total_area,
    tenure_type: input.tenure_type,
    soil_type: input.soil_type,
    topography: input.topography,
    irrigation_type: input.irrigation_type,
    latitude: input.latitude,
    longitude: input.longitude,
    gps_accuracy: input.gps_accuracy ?? null,
    qr_code: qrCode,
    sync_status: 'pending_sync',
    updated_at: now,
    parcels: savedParcels,
  };

  if (db) {
    await db.runAsync(
      `INSERT INTO farms (
        id, fid, farmer_id, farmer_lfid, farmer_name, name, barangay, total_area,
        tenure_type, soil_type, topography, irrigation_type, latitude, longitude,
        gps_accuracy, qr_code, sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_sync', ?)`,
      [
        farmRecord.id,
        farmRecord.fid,
        farmRecord.farmer_id,
        farmRecord.farmer_lfid,
        farmRecord.farmer_name,
        farmRecord.name,
        farmRecord.barangay,
        farmRecord.total_area,
        farmRecord.tenure_type,
        farmRecord.soil_type,
        farmRecord.topography,
        farmRecord.irrigation_type,
        farmRecord.latitude,
        farmRecord.longitude,
        farmRecord.gps_accuracy ?? null,
        farmRecord.qr_code,
        now,
      ]
    );

    for (const p of savedParcels) {
      await db.runAsync(
        `INSERT INTO farm_parcels (
          id, fpid, farm_id, parcel_number, commodity, variety, area,
          latitude, longitude, qr_code, sync_status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_sync', ?)`,
        [
          p.id,
          p.fpid,
          p.farm_id,
          p.parcel_number,
          p.commodity,
          p.variety,
          p.area,
          p.latitude,
          p.longitude,
          p.qr_code,
          now,
        ]
      );
    }

    await enqueueSyncOperation(db, {
      transaction_id: txId,
      entity_type: 'farm',
      action_type: 'create',
      entity_local_id: farmRecord.id,
      payload: farmRecord,
      media_ids: input.evidenceIds || [],
    });

    await insertActivityLog(db, {
      transaction_id: txId,
      activity_type: 'farm_registration',
      title: `Farm Registered: ${farmRecord.name}`,
      subtitle: `${savedParcels.length} parcel(s) • ${farmRecord.total_area} ha in Brgy. ${farmRecord.barangay}`,
      farmer_name: farmRecord.farmer_name,
      farmer_lfid: farmRecord.farmer_lfid,
      barangay: farmRecord.barangay,
      status: 'Pending Sync',
      sync_status: 'pending_sync',
      latitude: farmRecord.latitude,
      longitude: farmRecord.longitude,
      accuracy: farmRecord.gps_accuracy ?? null,
      evidence_count: input.evidenceIds?.length || 0,
    });
  }

  notifyDatabaseChanges();
  return farmRecord;
}

export async function getAllCropMonitoringRecords(): Promise<LocalCropMonitoringRecord[]> {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM crop_monitoring_records ORDER BY updated_at DESC'
  );
  return rows.map((r) => ({
    id: r.id,
    transaction_id: r.transaction_id,
    server_id: r.server_id,
    farmer_id: r.farmer_id,
    farmer_name: r.farmer_name,
    farmer_lfid: r.farmer_lfid,
    farm_id: r.farm_id,
    farm_name: r.farm_name,
    parcel: r.parcel,
    commodity: r.commodity,
    variety: r.variety || '',
    growth_stage: r.growth_stage,
    health_status: r.health_status,
    issues: JSON.parse(r.issues_json || '[]'),
    severity: r.severity,
    affected_area: r.affected_area,
    affected_pct: r.affected_pct,
    weather_condition: r.weather_condition,
    temperature: r.temperature,
    humidity: r.humidity,
    wind_speed: r.wind_speed,
    notes: r.notes,
    latitude: r.latitude,
    longitude: r.longitude,
    gps_accuracy: r.gps_accuracy,
    gps_mocked: Boolean(r.gps_mocked),
    gps_exception_reason: r.gps_exception_reason,
    detected_barangay: r.detected_barangay,
    barangay_verified: Boolean(r.barangay_verified),
    monitoring_status: r.monitoring_status || 'Ongoing',
    entry_status: r.entry_status || 'pending_review',
    sync_status: r.sync_status || 'pending_sync',
    conflict_reason: r.conflict_reason,
    photos_count: Number(r.photos_count || 0),
    evidence_ids: JSON.parse(r.evidence_ids_json || '[]'),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function saveCropMonitoringOffline(
  input: Omit<
    LocalCropMonitoringRecord,
    'id' | 'transaction_id' | 'sync_status' | 'created_at' | 'updated_at'
  > & { id?: string; transaction_id?: string }
): Promise<LocalCropMonitoringRecord> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = input.id || `mon-${Date.now()}`;
  const txId = input.transaction_id || `TX-MON-${Date.now()}`;

  const record: LocalCropMonitoringRecord = {
    ...input,
    id,
    transaction_id: txId,
    sync_status: 'pending_sync',
    created_at: now,
    updated_at: now,
  };

  if (db) {
    await db.runAsync(
      `INSERT OR REPLACE INTO crop_monitoring_records (
        id, transaction_id, farmer_id, farmer_name, farmer_lfid, farm_id, farm_name,
        parcel, commodity, variety, growth_stage, health_status, issues_json, severity,
        affected_area, affected_pct, weather_condition, temperature, humidity, wind_speed,
        notes, latitude, longitude, gps_accuracy, gps_mocked, gps_exception_reason,
        detected_barangay, barangay_verified, monitoring_status, entry_status, sync_status,
        photos_count, evidence_ids_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_sync', ?, ?, ?, ?)`,
      [
        record.id,
        record.transaction_id,
        record.farmer_id,
        record.farmer_name,
        record.farmer_lfid,
        record.farm_id,
        record.farm_name,
        record.parcel,
        record.commodity,
        record.variety,
        record.growth_stage,
        record.health_status,
        JSON.stringify(record.issues),
        record.severity,
        record.affected_area,
        record.affected_pct,
        record.weather_condition,
        record.temperature,
        record.humidity,
        record.wind_speed,
        record.notes,
        record.latitude,
        record.longitude,
        record.gps_accuracy,
        record.gps_mocked ? 1 : 0,
        record.gps_exception_reason ?? null,
        record.detected_barangay ?? null,
        record.barangay_verified ? 1 : 0,
        record.monitoring_status,
        record.entry_status,
        record.photos_count,
        JSON.stringify(record.evidence_ids || []),
        record.created_at,
        record.updated_at,
      ]
    );

    await enqueueSyncOperation(db, {
      transaction_id: txId,
      entity_type: 'crop_monitoring',
      action_type: input.id ? 'update' : 'create',
      entity_local_id: record.id,
      payload: record,
      media_ids: record.evidence_ids || [],
    });

    await insertActivityLog(db, {
      transaction_id: txId,
      activity_type: 'crop_monitoring',
      title: `Crop Monitoring: ${record.commodity} (${record.growth_stage})`,
      subtitle: `${record.farm_name} • ${record.parcel} • Health: ${record.health_status.toUpperCase()}`,
      farmer_name: record.farmer_name,
      farmer_lfid: record.farmer_lfid,
      barangay: record.detected_barangay || 'Poblacion',
      status: record.monitoring_status,
      sync_status: 'pending_sync',
      latitude: record.latitude,
      longitude: record.longitude,
      accuracy: record.gps_accuracy,
      evidence_count: record.photos_count,
    });
  }

  notifyDatabaseChanges();
  return record;
}

export async function getAllDamageReportsAndEntries(): Promise<{
  reports: LocalDamageReport[];
  entries: LocalDamageEntry[];
}> {
  const db = await getDatabase();
  if (!db) return { reports: [], entries: [] };

  const repRows = await db.getAllAsync<any>(
    'SELECT * FROM crop_damage_reports ORDER BY created_at DESC'
  );
  const entRows = await db.getAllAsync<any>(
    'SELECT * FROM crop_damage_entries ORDER BY updated_at DESC'
  );

  return {
    reports: repRows.map((r) => ({
      id: r.id,
      server_id: r.server_id,
      name: r.name,
      barangay: r.barangay,
      recorded_date: r.recorded_date,
      status: r.status,
      technician_id: r.technician_id,
      technician_name: r.technician_name,
      is_mine: Boolean(r.is_mine),
      sync_status: r.sync_status || 'synced',
      created_at: r.created_at,
    })),
    entries: entRows.map((e) => ({
      id: e.id,
      transaction_id: e.transaction_id,
      server_id: e.server_id,
      report_id: e.report_id,
      farmer_id: e.farmer_id,
      farmer_name: e.farmer_name,
      lfid: e.lfid,
      farm_name: e.farm_name,
      parcel_name: e.parcel_name,
      commodity: e.commodity,
      damage_type: e.damage_type,
      severity: e.severity,
      affected_area: e.affected_area,
      affected_pct: e.affected_pct,
      estimated_loss: e.estimated_loss,
      notes: e.notes,
      latitude: e.latitude,
      longitude: e.longitude,
      gps_accuracy: e.gps_accuracy,
      gps_mocked: Boolean(e.gps_mocked),
      gps_exception_reason: e.gps_exception_reason,
      detected_barangay: e.detected_barangay,
      barangay_verified: Boolean(e.barangay_verified),
      status: e.status,
      sync_status: e.sync_status || 'pending_sync',
      conflict_reason: e.conflict_reason,
      photos_count: Number(e.photos_count || 0),
      evidence_ids: JSON.parse(e.evidence_ids_json || '[]'),
      created_at: e.created_at,
      updated_at: e.updated_at,
    })),
  };
}

export async function createDamageReportOffline(input: {
  name: string;
  barangay: string;
  recorded_date: string;
  technician_id: string;
  technician_name: string;
}): Promise<LocalDamageReport> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `dmg-rep-${Date.now()}`;
  const report: LocalDamageReport = {
    id,
    name: input.name,
    barangay: input.barangay,
    recorded_date: input.recorded_date,
    status: 'draft',
    technician_id: input.technician_id,
    technician_name: input.technician_name,
    is_mine: true,
    sync_status: 'pending_sync',
    created_at: now,
  };

  if (db) {
    await db.runAsync(
      `INSERT INTO crop_damage_reports (
        id, name, barangay, recorded_date, status, technician_id, technician_name, is_mine, sync_status, created_at
      ) VALUES (?, ?, ?, ?, 'draft', ?, ?, 1, 'pending_sync', ?)`,
      [
        report.id,
        report.name,
        report.barangay,
        report.recorded_date,
        report.technician_id,
        report.technician_name,
        now,
      ]
    );
  }
  notifyDatabaseChanges();
  return report;
}

export async function saveDamageEntryOffline(
  input: Omit<LocalDamageEntry, 'id' | 'transaction_id' | 'sync_status' | 'created_at' | 'updated_at'>
): Promise<LocalDamageEntry> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `dmg-ent-${Date.now()}`;
  const txId = `TX-DMG-${Date.now()}`;

  const entry: LocalDamageEntry = {
    ...input,
    id,
    transaction_id: txId,
    sync_status: 'pending_sync',
    created_at: now,
    updated_at: now,
  };

  if (db) {
    await db.runAsync(
      `INSERT INTO crop_damage_entries (
        id, transaction_id, report_id, farmer_id, farmer_name, lfid, farm_name, parcel_name,
        commodity, damage_type, severity, affected_area, affected_pct, estimated_loss, notes,
        latitude, longitude, gps_accuracy, gps_mocked, gps_exception_reason, detected_barangay,
        barangay_verified, status, sync_status, photos_count, evidence_ids_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_sync', ?, ?, ?, ?)`,
      [
        entry.id,
        entry.transaction_id,
        entry.report_id,
        entry.farmer_id,
        entry.farmer_name,
        entry.lfid,
        entry.farm_name,
        entry.parcel_name,
        entry.commodity,
        entry.damage_type,
        entry.severity,
        entry.affected_area,
        entry.affected_pct,
        entry.estimated_loss,
        entry.notes,
        entry.latitude,
        entry.longitude,
        entry.gps_accuracy,
        entry.gps_mocked ? 1 : 0,
        entry.gps_exception_reason ?? null,
        entry.detected_barangay ?? null,
        entry.barangay_verified ? 1 : 0,
        entry.status,
        entry.photos_count,
        JSON.stringify(entry.evidence_ids || []),
        now,
        now,
      ]
    );

    await enqueueSyncOperation(db, {
      transaction_id: txId,
      entity_type: 'crop_damage',
      action_type: 'create',
      entity_local_id: entry.id,
      payload: entry,
      media_ids: entry.evidence_ids || [],
    });

    await insertActivityLog(db, {
      transaction_id: txId,
      activity_type: 'crop_damage',
      title: `Damage Assessment: ${entry.damage_type} (${entry.severity.toUpperCase()})`,
      subtitle: `${entry.commodity} • ${entry.affected_area} ha affected • Est. ₱${Number(entry.estimated_loss || 0).toLocaleString()}`,
      farmer_name: entry.farmer_name,
      farmer_lfid: entry.lfid,
      barangay: entry.detected_barangay || 'San Isidro',
      status: 'Pending Sync',
      sync_status: 'pending_sync',
      latitude: entry.latitude,
      longitude: entry.longitude,
      accuracy: entry.gps_accuracy,
      evidence_count: entry.photos_count,
    });
  }

  notifyDatabaseChanges();
  return entry;
}

export async function getAllDistributionData(): Promise<{
  batches: LocalDistributionBatch[];
  allocations: LocalDistributionAllocation[];
}> {
  const db = await getDatabase();
  if (!db) return { batches: [], allocations: [] };

  const batchRows = await db.getAllAsync<any>(
    'SELECT * FROM distribution_batches ORDER BY release_date DESC'
  );
  const allocRows = await db.getAllAsync<any>(
    'SELECT * FROM distribution_allocations ORDER BY updated_at DESC'
  );

  return {
    batches: batchRows.map((b) => ({
      id: b.id,
      server_id: b.server_id,
      program_id: b.program_id,
      title: b.title,
      commodity: b.commodity,
      unit: b.unit,
      barangay: b.barangay,
      batch_no: b.batch_no,
      total_stock: Number(b.total_stock),
      remaining_stock: Number(b.remaining_stock),
      total_farmers: Number(b.total_farmers),
      served_farmers: Number(b.served_farmers),
      status: b.status,
      release_date: b.release_date,
      sync_status: b.sync_status || 'synced',
      updated_at: b.updated_at,
    })),
    allocations: allocRows.map((a) => ({
      id: a.id,
      transaction_id: a.transaction_id,
      server_id: a.server_id,
      batch_id: a.batch_id,
      farmer_id: a.farmer_id,
      farmer_name: a.farmer_name,
      lfid: a.lfid,
      rsbsa_number: a.rsbsa_number || '',
      barangay: a.barangay,
      allocated_qty: Number(a.allocated_qty),
      actual_qty: Number(a.actual_qty),
      unit: a.unit,
      lot_number: a.lot_number || '',
      status: a.status,
      qr_verified: Boolean(a.qr_verified),
      secondary_verified: Boolean(a.secondary_verified),
      secondary_verification_method: a.secondary_verification_method || '',
      signature_uri: a.signature_uri,
      acknowledgement_type: a.acknowledgement_type || 'electronic_signature',
      latitude: a.latitude,
      longitude: a.longitude,
      gps_accuracy: a.gps_accuracy,
      gps_mocked: Boolean(a.gps_mocked),
      gps_exception_reason: a.gps_exception_reason,
      detected_barangay: a.detected_barangay,
      barangay_verified: Boolean(a.barangay_verified),
      remarks: a.remarks || '',
      distributed_by_id: a.distributed_by_id,
      distributed_by_name: a.distributed_by_name,
      distributed_at: a.distributed_at,
      evidence_ids: JSON.parse(a.evidence_ids_json || '[]'),
      sync_status: a.sync_status || 'synced',
      conflict_reason: a.conflict_reason,
      updated_at: a.updated_at,
    })),
  };
}

export async function recordAssistanceDistributionOffline(input: {
  allocation_id: string;
  batch_id: string;
  actual_qty: number;
  lot_number: string;
  qr_verified: boolean;
  secondary_verified: boolean;
  secondary_verification_method: string;
  signature_uri: string | null;
  acknowledgement_type: 'electronic_signature' | 'thumbmark_witnessed' | 'id_presented';
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  gps_mocked: boolean;
  gps_exception_reason?: string | null;
  detected_barangay?: string | null;
  barangay_verified?: boolean;
  remarks: string;
  technician_id: string;
  technician_name: string;
  evidence_ids: string[];
}): Promise<LocalDistributionAllocation> {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Offline database unavailable');
  }

  const existing = await db.getFirstAsync<any>(
    'SELECT * FROM distribution_allocations WHERE id = ?',
    [input.allocation_id]
  );
  if (!existing) {
    throw new Error('Beneficiary allocation record not found');
  }
  if (existing.status === 'distributed') {
    throw new Error(
      `Duplicate Distribution Blocked: ${existing.farmer_name} (${existing.lfid}) has already received assistance in this batch.`
    );
  }

  const batch = await db.getFirstAsync<any>(
    'SELECT * FROM distribution_batches WHERE id = ?',
    [input.batch_id]
  );
  if (!batch) {
    throw new Error('Distribution batch not found');
  }
  if (Number(batch.remaining_stock) < input.actual_qty) {
    throw new Error(
      `Insufficient Offline Stock Allocation: Only ${batch.remaining_stock} ${batch.unit} remaining in ${batch.batch_no}, cannot release ${input.actual_qty}.`
    );
  }

  const now = new Date().toISOString();
  const txId = `TX-DIST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  await db.runAsync(
    `UPDATE distribution_allocations SET
      transaction_id = ?,
      actual_qty = ?,
      lot_number = ?,
      status = 'distributed',
      qr_verified = ?,
      secondary_verified = ?,
      secondary_verification_method = ?,
      signature_uri = ?,
      acknowledgement_type = ?,
      latitude = ?,
      longitude = ?,
      gps_accuracy = ?,
      gps_mocked = ?,
      gps_exception_reason = ?,
      detected_barangay = ?,
      barangay_verified = ?,
      remarks = ?,
      distributed_by_id = ?,
      distributed_by_name = ?,
      distributed_at = ?,
      evidence_ids_json = ?,
      sync_status = 'pending_sync',
      updated_at = ?
    WHERE id = ?`,
    [
      txId,
      input.actual_qty,
      input.lot_number,
      input.qr_verified ? 1 : 0,
      input.secondary_verified ? 1 : 0,
      input.secondary_verification_method,
      input.signature_uri,
      input.acknowledgement_type,
      input.latitude,
      input.longitude,
      input.gps_accuracy,
      input.gps_mocked ? 1 : 0,
      input.gps_exception_reason ?? null,
      input.detected_barangay ?? null,
      input.barangay_verified ? 1 : 0,
      input.remarks,
      input.technician_id,
      input.technician_name,
      now,
      JSON.stringify(input.evidence_ids || []),
      now,
      input.allocation_id,
    ]
  );

  const newRemaining = Math.max(0, Number(batch.remaining_stock) - input.actual_qty);
  const newServed = Number(batch.served_farmers) + 1;
  const newBatchStatus =
    newServed >= Number(batch.total_farmers) || newRemaining === 0 ? 'completed' : 'ongoing';

  await db.runAsync(
    `UPDATE distribution_batches SET
      remaining_stock = ?,
      served_farmers = ?,
      status = ?,
      sync_status = 'pending_sync',
      updated_at = ?
    WHERE id = ?`,
    [newRemaining, newServed, newBatchStatus, now, input.batch_id]
  );

  const updatedRow = await db.getFirstAsync<any>(
    'SELECT * FROM distribution_allocations WHERE id = ?',
    [input.allocation_id]
  );

  await enqueueSyncOperation(db, {
    transaction_id: txId,
    entity_type: 'allocation',
    action_type: 'update',
    entity_local_id: input.allocation_id,
    payload: {
      ...updatedRow,
      batch_no: batch.batch_no,
      program_title: batch.title,
      commodity: batch.commodity,
    },
    media_ids: input.evidence_ids || [],
  });

  await insertActivityLog(db, {
    transaction_id: txId,
    activity_type: 'distribution',
    title: `QR Assistance Released (${input.actual_qty} ${existing.unit})`,
    subtitle: `${batch.title} • Lot ${input.lot_number || 'N/A'} • Pending Server Reconciliation`,
    farmer_name: existing.farmer_name,
    farmer_lfid: existing.lfid,
    barangay: existing.barangay,
    status: 'Pending Sync',
    sync_status: 'pending_sync',
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy: input.gps_accuracy,
    evidence_count: (input.evidence_ids?.length || 0) + (input.signature_uri ? 1 : 0),
  });

  notifyDatabaseChanges();

  return {
    id: updatedRow.id,
    transaction_id: updatedRow.transaction_id,
    server_id: updatedRow.server_id,
    batch_id: updatedRow.batch_id,
    farmer_id: updatedRow.farmer_id,
    farmer_name: updatedRow.farmer_name,
    lfid: updatedRow.lfid,
    rsbsa_number: updatedRow.rsbsa_number || '',
    barangay: updatedRow.barangay,
    allocated_qty: Number(updatedRow.allocated_qty),
    actual_qty: Number(updatedRow.actual_qty),
    unit: updatedRow.unit,
    lot_number: updatedRow.lot_number || '',
    status: updatedRow.status,
    qr_verified: Boolean(updatedRow.qr_verified),
    secondary_verified: Boolean(updatedRow.secondary_verified),
    secondary_verification_method: updatedRow.secondary_verification_method || '',
    signature_uri: updatedRow.signature_uri,
    acknowledgement_type: updatedRow.acknowledgement_type || 'electronic_signature',
    latitude: updatedRow.latitude,
    longitude: updatedRow.longitude,
    gps_accuracy: updatedRow.gps_accuracy,
    gps_mocked: Boolean(updatedRow.gps_mocked),
    gps_exception_reason: updatedRow.gps_exception_reason,
    detected_barangay: updatedRow.detected_barangay,
    barangay_verified: Boolean(updatedRow.barangay_verified),
    remarks: updatedRow.remarks || '',
    distributed_by_id: updatedRow.distributed_by_id,
    distributed_by_name: updatedRow.distributed_by_name,
    distributed_at: updatedRow.distributed_at,
    evidence_ids: JSON.parse(updatedRow.evidence_ids_json || '[]'),
    sync_status: 'pending_sync',
    updated_at: updatedRow.updated_at,
  };
}

export async function insertFieldEvidenceRecord(record: FieldEvidenceRecord): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  await db.runAsync(
    `INSERT OR REPLACE INTO field_evidence (
      evidence_id, transaction_id, activity_type, entity_id, technician_id, technician_name,
      farmer_id, farmer_lfid, farmer_name, farm_id, parcel_id, local_original_uri, remote_url,
      file_hash_sha256, file_size, mime_type, latitude, longitude, accuracy, altitude,
      gps_timestamp, capture_timestamp, is_mock_location, is_stale_location, gps_exception_reason,
      gps_exception_notes, detected_barangay, barangay_verified, device_model, os_version,
      sync_status, server_receipt_at, verification_status, rejection_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.evidence_id,
      record.transaction_id,
      record.activity_type,
      record.entity_id,
      record.technician_id,
      record.technician_name,
      record.farmer_id,
      record.farmer_lfid,
      record.farmer_name,
      record.farm_id,
      record.parcel_id,
      record.local_original_uri,
      record.remote_url,
      record.file_hash_sha256,
      record.file_size,
      record.mime_type,
      record.latitude,
      record.longitude,
      record.accuracy,
      record.altitude,
      record.gps_timestamp,
      record.capture_timestamp,
      record.is_mock_location ? 1 : 0,
      record.is_stale_location ? 1 : 0,
      record.gps_exception_reason,
      record.gps_exception_notes,
      record.detected_barangay,
      record.barangay_verified ? 1 : 0,
      record.device_model,
      record.os_version,
      record.sync_status,
      record.server_receipt_at,
      record.verification_status,
      record.rejection_remarks,
    ]
  );

  notifyDatabaseChanges();
}

export async function getEvidenceByIds(evidenceIds: string[]): Promise<FieldEvidenceRecord[]> {
  const db = await getDatabase();
  if (!db || evidenceIds.length === 0) return [];
  const placeholders = evidenceIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM field_evidence WHERE evidence_id IN (${placeholders})`,
    evidenceIds
  );
  return rows.map(mapRowToEvidence);
}

export async function getAllFieldEvidence(): Promise<FieldEvidenceRecord[]> {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM field_evidence ORDER BY capture_timestamp DESC'
  );
  return rows.map(mapRowToEvidence);
}

function mapRowToEvidence(r: any): FieldEvidenceRecord {
  return {
    evidence_id: r.evidence_id,
    transaction_id: r.transaction_id,
    activity_type: r.activity_type,
    entity_id: r.entity_id,
    technician_id: r.technician_id,
    technician_name: r.technician_name,
    farmer_id: r.farmer_id,
    farmer_lfid: r.farmer_lfid,
    farmer_name: r.farmer_name || '',
    farm_id: r.farm_id,
    parcel_id: r.parcel_id,
    local_original_uri: r.local_original_uri,
    remote_url: r.remote_url,
    file_hash_sha256: r.file_hash_sha256,
    file_size: Number(r.file_size || 0),
    mime_type: r.mime_type || 'image/jpeg',
    latitude: r.latitude,
    longitude: r.longitude,
    accuracy: r.accuracy,
    altitude: r.altitude,
    gps_timestamp: r.gps_timestamp,
    capture_timestamp: r.capture_timestamp,
    is_mock_location: Boolean(r.is_mock_location),
    is_stale_location: Boolean(r.is_stale_location),
    gps_exception_reason: r.gps_exception_reason,
    gps_exception_notes: r.gps_exception_notes,
    detected_barangay: r.detected_barangay,
    barangay_verified: Boolean(r.barangay_verified),
    device_model: r.device_model,
    os_version: r.os_version,
    sync_status: r.sync_status,
    server_receipt_at: r.server_receipt_at,
    verification_status: r.verification_status,
    rejection_remarks: r.rejection_remarks,
  };
}

export async function enqueueSyncOperation(
  db: SQLite.SQLiteDatabase,
  input: {
    transaction_id: string;
    entity_type: SyncQueueItem['entity_type'];
    action_type: SyncQueueItem['action_type'];
    entity_local_id: string;
    payload: any;
    media_ids?: string[];
  }
): Promise<string> {
  const opId = `OP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sync_queue (
      operation_id, transaction_id, entity_type, action_type, entity_local_id,
      payload_json, media_ids_json, status, retry_count, max_retries, next_retry_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, 5, 0, ?)`,
    [
      opId,
      input.transaction_id,
      input.entity_type,
      input.action_type,
      input.entity_local_id,
      JSON.stringify(input.payload),
      JSON.stringify(input.media_ids || []),
      now,
    ]
  );

  return opId;
}

export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC'
  );
  return rows.map((r) => ({
    operation_id: r.operation_id,
    transaction_id: r.transaction_id,
    entity_type: r.entity_type,
    action_type: r.action_type,
    entity_local_id: r.entity_local_id,
    payload_json: r.payload_json,
    media_ids_json: r.media_ids_json || '[]',
    status: r.status,
    retry_count: Number(r.retry_count || 0),
    max_retries: Number(r.max_retries || 5),
    next_retry_at: Number(r.next_retry_at || 0),
    last_error: r.last_error,
    conflict_data_json: r.conflict_data_json,
    created_at: r.created_at,
    synced_at: r.synced_at,
  }));
}

export async function insertActivityLog(
  db: SQLite.SQLiteDatabase,
  input: Omit<LocalActivityLog, 'id' | 'created_at'>
): Promise<void> {
  const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO activity_logs (
      id, transaction_id, activity_type, title, subtitle, farmer_name, farmer_lfid,
      barangay, status, sync_status, latitude, longitude, accuracy, evidence_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.transaction_id,
      input.activity_type,
      input.title,
      input.subtitle,
      input.farmer_name,
      input.farmer_lfid,
      input.barangay,
      input.status,
      input.sync_status,
      input.latitude,
      input.longitude,
      input.accuracy,
      input.evidence_count,
      now,
    ]
  );
}

export async function getAllActivityLogs(): Promise<LocalActivityLog[]> {
  const db = await getDatabase();
  if (!db) return [];
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 100'
  );
  return rows.map((r) => ({
    id: r.id,
    transaction_id: r.transaction_id,
    activity_type: r.activity_type,
    title: r.title,
    subtitle: r.subtitle,
    farmer_name: r.farmer_name,
    farmer_lfid: r.farmer_lfid,
    barangay: r.barangay,
    status: r.status,
    sync_status: r.sync_status,
    latitude: r.latitude,
    longitude: r.longitude,
    accuracy: r.accuracy,
    evidence_count: Number(r.evidence_count || 0),
    created_at: r.created_at,
  }));
}

export async function getDashboardSummaryMetrics(): Promise<{
  totalFarmers: number;
  totalFarms: number;
  monitoringCount: number;
  damageEntriesCount: number;
  pendingDistributionsCount: number;
  completedDistributionsCount: number;
  pendingSyncCount: number;
  failedSyncCount: number;
  conflictSyncCount: number;
  evidenceCapturedCount: number;
}> {
  const db = await getDatabase();
  if (!db) {
    return {
      totalFarmers: 6,
      totalFarms: 3,
      monitoringCount: 1,
      damageEntriesCount: 1,
      pendingDistributionsCount: 5,
      completedDistributionsCount: 1,
      pendingSyncCount: 0,
      failedSyncCount: 0,
      conflictSyncCount: 0,
      evidenceCapturedCount: 0,
    };
  }

  const [
    farmersCount,
    farmsCount,
    monCount,
    dmgCount,
    distPending,
    distCompleted,
    syncPending,
    syncFailed,
    syncConflict,
    evCount,
  ] = await Promise.all([
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM farmers'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM farms'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM crop_monitoring_records'),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM crop_damage_entries'),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM distribution_allocations WHERE status = 'pending'"
    ),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM distribution_allocations WHERE status = 'distributed'"
    ),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('pending', 'syncing')"
    ),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM sync_queue WHERE status = 'failed'"
    ),
    db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM sync_queue WHERE status = 'conflict'"
    ),
    db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM field_evidence'),
  ]);

  return {
    totalFarmers: farmersCount?.c || 0,
    totalFarms: farmsCount?.c || 0,
    monitoringCount: monCount?.c || 0,
    damageEntriesCount: dmgCount?.c || 0,
    pendingDistributionsCount: distPending?.c || 0,
    completedDistributionsCount: distCompleted?.c || 0,
    pendingSyncCount: syncPending?.c || 0,
    failedSyncCount: syncFailed?.c || 0,
    conflictSyncCount: syncConflict?.c || 0,
    evidenceCapturedCount: evCount?.c || 0,
  };
}
