import { GeotaggedCameraModal } from '@/components/evidence/GeotaggedCameraModal';
import {
  FieldEvidenceRecord,
  getAllFarmers,
  getAllFarms,
  getDatabase,
  enqueueSyncOperation,
  saveFarmOffline,
  subscribeDatabaseChanges,
  notifyDatabaseChanges,
} from '@/lib/db/database';
import { acquireVerifiedLocation } from '@/lib/services/evidenceService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Leaf,
  MapPin,
  Navigation,
  Plus,
  QrCode,
  Search,
  Sprout,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─── Constants ─── */
const HEADER_BG = '#0891B2';
const AVATAR_PAL = ['#16A34A', '#2563EB', '#9333EA', '#F59E0B', '#EF4444', '#0891B2'];
const avatarColor = (idx: number) => AVATAR_PAL[idx % AVATAR_PAL.length];
const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const BARANGAYS = [
  'Poblacion',
  'San Isidro',
  'Mabuhay',
  'Maligaya',
  'Bagong Silang',
  'Santa Cruz',
];
const TENURE_TYPES = [
  'Owner',
  'Tenant',
  'Lessee',
  'Free Patent',
  'Homestead',
  'CLOA',
  'Other',
];
const COMMODITIES = [
  'Rice',
  'Corn',
  'Vegetables',
  'Coconut',
  'Sugarcane',
  'Banana',
  'Cacao',
  'Coffee',
  'Fruit Trees',
  'Other',
];
const VARIETIES = {
  Rice: ['IR-64', 'NSIC Rc 222', 'NSIC Rc 160', 'NSIC Rc 216', 'Malagkit', 'Dinorado', 'Other'],
  Corn: ['Pioneer P3585', 'OPV', 'Hybrid White', 'Hybrid Yellow', 'Sweet Corn', 'Other'],
  Vegetables: ['Eggplant Casino F1', 'Ampalaya', 'Sitaw', 'Kamote', 'Repolyo', 'Kamatis', 'Other'],
  default: ['Local Variety', 'Improved Variety', 'Hybrid', 'Other'],
};
const getVarieties = (commodity: string) =>
  (VARIETIES as any)[commodity] ?? VARIETIES.default;

/* ─── Types ─── */
type FarmerPickerItem = {
  id: string;
  idx: number;
  name: string;
  lfid: string;
  barangay: string;
};
type ParcelUI = {
  id: string;
  fpid: string;
  commodity: string;
  variety: string;
  area: string;
  lat: string;
  lng: string;
  synced: boolean;
};
type FarmUI = {
  id: string;
  fid: string;
  name: string;
  barangay: string;
  totalArea: string;
  tenure: string;
  lat: string;
  lng: string;
  synced: boolean;
  parcels: ParcelUI[];
  expanded: boolean;
};

export default function FarmRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    farmerId?: string;
    farmerName?: string;
    farmerLfid?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  /* Theme */
  const bg = isDark ? '#041318' : '#ECFEFF';
  const card = isDark ? '#0B2028' : '#FFFFFF';
  const border = isDark ? '#164050' : '#A5F3FC';
  const textPrimary = isDark ? '#ECFDF5' : '#164E63';
  const textMuted = isDark ? '#67E8F9' : '#6B7280';

  /* ── State ── */
  const [farmers, setFarmers] = useState<FarmerPickerItem[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerPickerItem | null>(null);
  const [farmerQuery, setFarmerQuery] = useState('');
  const [farmsByFarmer, setFarmsByFarmer] = useState<Record<string, FarmUI[]>>({});

  /* Add Farm modal */
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [farmBarangay, setFarmBarangay] = useState('');
  const [farmArea, setFarmArea] = useState('');
  const [farmTenure, setFarmTenure] = useState('Owner');
  const [farmLat, setFarmLat] = useState('');
  const [farmLng, setFarmLng] = useState('');
  const [farmAcc, setFarmAcc] = useState<number | null>(null);
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [farmErrors, setFarmErrors] = useState<Record<string, string>>({});
  const [farmEvidence, setFarmEvidence] = useState<FieldEvidenceRecord[]>([]);
  const [showEvidenceCamera, setShowEvidenceCamera] = useState(false);

  /* Add Parcel modal */
  const [showAddParcel, setShowAddParcel] = useState(false);
  const [targetFarm, setTargetFarm] = useState<FarmUI | null>(null);
  const [parcelComm, setParcelComm] = useState('');
  const [parcelVariety, setParcelVariety] = useState('');
  const [parcelArea, setParcelArea] = useState('');
  const [parcelLat, setParcelLat] = useState('');
  const [parcelLng, setParcelLng] = useState('');
  const [parcelGpsCap, setParcelGpsCap] = useState(false);
  const [parcelErrors, setParcelErrors] = useState<Record<string, string>>({});

  /* Dropdown modals */
  const [ddTarget, setDdTarget] = useState<string | null>(null);
  const [ddOptions, setDdOptions] = useState<string[]>([]);
  const [ddOnSelect, setDdOnSelect] = useState<((v: string) => void) | null>(null);

  const loadDataFromSqlite = React.useCallback(async () => {
    const [dbFarmers, dbFarms] = await Promise.all([getAllFarmers(), getAllFarms()]);
    const mappedFarmers: FarmerPickerItem[] = dbFarmers.map((f, i) => ({
      id: f.id,
      idx: i + 1,
      name: `${f.first_name} ${f.last_name}`.trim(),
      lfid: f.lfid,
      barangay: f.barangay,
    }));
    setFarmers(mappedFarmers);

    const grouped: Record<string, FarmUI[]> = {};
    for (const f of dbFarms) {
      if (!grouped[f.farmer_id]) grouped[f.farmer_id] = [];
      grouped[f.farmer_id].push({
        id: f.id,
        fid: f.fid,
        name: f.name,
        barangay: f.barangay,
        totalArea: String(f.total_area),
        tenure: f.tenure_type,
        lat: f.latitude ? String(f.latitude) : '',
        lng: f.longitude ? String(f.longitude) : '',
        synced: f.sync_status === 'synced',
        expanded: true,
        parcels: f.parcels.map((p) => ({
          id: p.id,
          fpid: p.fpid,
          commodity: p.commodity,
          variety: p.variety,
          area: String(p.area),
          lat: p.latitude ? String(p.latitude) : '',
          lng: p.longitude ? String(p.longitude) : '',
          synced: p.sync_status === 'synced',
        })),
      });
    }
    setFarmsByFarmer(grouped);

    if (params.farmerId || params.farmerLfid) {
      const match = mappedFarmers.find(
        (m) => m.id === params.farmerId || m.lfid === params.farmerLfid
      );
      if (match) {
        setSelectedFarmer((prev) => prev || match);
      }
    }
  }, [params.farmerId, params.farmerLfid]);

  useEffect(() => {
    loadDataFromSqlite();
    return subscribeDatabaseChanges(loadDataFromSqlite);
  }, [loadDataFromSqlite]);

  const filteredFarmers = farmers.filter((f) => {
    const q = farmerQuery.toLowerCase();
    return !q || f.name.toLowerCase().includes(q) || f.lfid.toLowerCase().includes(q);
  });

  const farmerFarms = selectedFarmer ? farmsByFarmer[selectedFarmer.id] ?? [] : [];

  const totalParcels = farmerFarms.reduce((s, f) => s + f.parcels.length, 0);
  const totalArea = farmerFarms.reduce(
    (s, f) => s + parseFloat(f.totalArea || '0'),
    0
  );
  const unsyncedCount =
    farmerFarms.filter((f) => !f.synced).length +
    farmerFarms.reduce(
      (s, f) => s + f.parcels.filter((p) => !p.synced).length,
      0
    );

  const openDropdown = (
    title: string,
    options: string[],
    onSelect: (v: string) => void
  ) => {
    setDdTarget(title);
    setDdOptions(options);
    setDdOnSelect(() => onSelect);
  };

  const captureRealGps = async (
    setLat: (v: string) => void,
    setLng: (v: string) => void,
    setCap: (v: boolean) => void
  ) => {
    setCap(true);
    try {
      const res = await acquireVerifiedLocation(
        {},
        selectedFarmer?.barangay || 'Poblacion'
      );
      if (res.success && res.latitude !== null && res.longitude !== null) {
        setLat(res.latitude.toFixed(6));
        setLng(res.longitude.toFixed(6));
        setFarmAcc(res.accuracy);
        if (!farmBarangay && res.detectedBarangay) {
          setFarmBarangay(res.detectedBarangay);
        }
      } else {
        // Fallback municipal coordinate if running on emulator without GNSS feed
        setLat('7.308520');
        setLng('125.684480');
        setFarmAcc(6.4);
      }
    } finally {
      setCap(false);
    }
  };

  const toggleExpand = (farmId: string) => {
    if (!selectedFarmer) return;
    setFarmsByFarmer((prev) => ({
      ...prev,
      [selectedFarmer.id]: (prev[selectedFarmer.id] ?? []).map((f) =>
        f.id === farmId ? { ...f, expanded: !f.expanded } : f
      ),
    }));
  };

  /* ── Add Farm ── */
  const validateFarm = () => {
    const errs: Record<string, string> = {};
    if (!farmName.trim()) errs.farmName = 'Farm name is required';
    if (!farmBarangay) errs.farmBarangay = 'Barangay is required';
    if (!farmArea.trim()) errs.farmArea = 'Total area is required';
    else if (isNaN(parseFloat(farmArea)) || parseFloat(farmArea) <= 0)
      errs.farmArea = 'Enter a valid area';
    if (!farmTenure) errs.farmTenure = 'Tenure type is required';
    setFarmErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddFarm = async () => {
    if (!validateFarm() || !selectedFarmer) return;
    await saveFarmOffline({
      farmer_id: selectedFarmer.id,
      farmer_lfid: selectedFarmer.lfid,
      farmer_name: selectedFarmer.name,
      name: farmName.trim(),
      barangay: farmBarangay.replace(/^Brgy\.\s*/i, ''),
      total_area: parseFloat(farmArea),
      tenure_type: farmTenure,
      soil_type: 'Clay Loam',
      topography: 'Flat / Plain',
      irrigation_type: 'Irrigated (NIA)',
      latitude: farmLat ? parseFloat(farmLat) : null,
      longitude: farmLng ? parseFloat(farmLng) : null,
      gps_accuracy: farmAcc,
      parcels: [],
      evidenceIds: farmEvidence.map((e) => e.evidence_id),
    });

    resetFarmForm();
    setShowAddFarm(false);
  };

  const resetFarmForm = () => {
    setFarmName('');
    setFarmBarangay(selectedFarmer?.barangay || '');
    setFarmArea('');
    setFarmTenure('Owner');
    setFarmLat('');
    setFarmLng('');
    setFarmAcc(null);
    setFarmEvidence([]);
    setFarmErrors({});
  };

  /* ── Add Parcel ── */
  const validateParcel = () => {
    if (!targetFarm || !selectedFarmer) return false;
    const errs: Record<string, string> = {};
    if (!parcelComm) errs.parcelComm = 'Commodity is required';
    if (!parcelVariety) errs.parcelVariety = 'Variety is required';
    if (!parcelArea.trim()) errs.parcelArea = 'Parcel area is required';
    else {
      const pArea = parseFloat(parcelArea);
      const fArea = parseFloat(targetFarm.totalArea || '0');
      const usedArea = targetFarm.parcels.reduce(
        (s, p) => s + parseFloat(p.area || '0'),
        0
      );
      if (isNaN(pArea) || pArea <= 0) errs.parcelArea = 'Enter a valid area';
      else if (usedArea + pArea > fArea)
        errs.parcelArea = `Exceeds farm area (${(fArea - usedArea).toFixed(2)} ha remaining)`;
    }
    setParcelErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddParcel = async () => {
    if (!validateParcel() || !targetFarm || !selectedFarmer) return;
    const db = await getDatabase();
    if (!db) return;

    const idx = targetFarm.parcels.length + 1;
    const fpid = `${targetFarm.fid}-P${idx}`;
    const parcelId = `parcel-${Date.now()}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO farm_parcels (
        id, fpid, farm_id, parcel_number, commodity, variety, area,
        latitude, longitude, qr_code, sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_sync', ?)`,
      [
        parcelId,
        fpid,
        targetFarm.id,
        `Parcel ${idx} (${parcelComm})`,
        parcelComm,
        parcelVariety,
        parseFloat(parcelArea),
        parcelLat ? parseFloat(parcelLat) : null,
        parcelLng ? parseFloat(parcelLng) : null,
        `AGROQR:v1:${fpid}`,
        now,
      ]
    );

    await enqueueSyncOperation(db, {
      transaction_id: `TX-PARCEL-${Date.now()}`,
      entity_type: 'farm_parcel',
      action_type: 'create',
      entity_local_id: parcelId,
      payload: {
        id: parcelId,
        fpid,
        farm_id: targetFarm.id,
        commodity: parcelComm,
        variety: parcelVariety,
        area: parseFloat(parcelArea),
        latitude: parcelLat ? parseFloat(parcelLat) : null,
        longitude: parcelLng ? parseFloat(parcelLng) : null,
      },
    });

    notifyDatabaseChanges();
    resetParcelForm();
    setShowAddParcel(false);
  };

  const resetParcelForm = () => {
    setParcelComm('');
    setParcelVariety('');
    setParcelArea('');
    setParcelLat('');
    setParcelLng('');
    setParcelErrors({});
  };

  const deleteParcel = async (farmId: string, parcelId: string) => {
    const db = await getDatabase();
    if (db) {
      await db.runAsync('DELETE FROM farm_parcels WHERE id = ?', [parcelId]);
      notifyDatabaseChanges();
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        <StatusBar barStyle="light-content" backgroundColor={HEADER_BG} translucent />

        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 8) },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Farm & Parcel Registration</Text>
            <Text style={styles.headerSub}>
              {selectedFarmer
                ? `Farms for ${selectedFarmer.name} (SQLite Offline)`
                : 'Select a farmer to manage geotagged parcels'}
            </Text>
          </View>
          {selectedFarmer && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                setSelectedFarmer(null);
                setFarmerQuery('');
              }}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* STEP 1 — Farmer selector */}
        {!selectedFarmer ? (
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.searchWrap,
                { backgroundColor: card, borderBottomColor: border },
              ]}
            >
              <View
                style={[
                  styles.searchBar,
                  {
                    backgroundColor: isDark ? '#0B2028' : '#ECFEFF',
                    borderColor: border,
                  },
                ]}
              >
                <Search size={16} color="#9CA3AF" />
                <TextInput
                  style={[styles.searchInput, { color: textPrimary }]}
                  placeholder="Search by name or LFID…"
                  placeholderTextColor="#9CA3AF"
                  value={farmerQuery}
                  onChangeText={setFarmerQuery}
                />
                {farmerQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setFarmerQuery('')}>
                    <X size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(dashboard)/scan' as any)}
                style={[styles.qrBtn, { backgroundColor: HEADER_BG }]}
              >
                <QrCode size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.pickerHint, { borderBottomColor: border }]}>
              <Text style={[styles.pickerHintText, { color: textMuted }]}>
                Tap a farmer to view and register their farms & parcels offline
              </Text>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredFarmers.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.farmerRow, { backgroundColor: card, borderColor: border }]}
                  onPress={() => setSelectedFarmer(f)}
                  activeOpacity={0.78}
                >
                  <View
                    style={[styles.farmerAvatar, { backgroundColor: avatarColor(f.idx) }]}
                  >
                    <Text style={styles.farmerAvatarText}>{getInitials(f.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.farmerName, { color: textPrimary }]}>{f.name}</Text>
                    <Text style={[styles.farmerSub, { color: HEADER_BG }]}>{f.lfid}</Text>
                    <Text style={[styles.farmerSub, { color: textMuted }]}>
                      Brgy. {f.barangay}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.farmCount,
                      {
                        backgroundColor: isDark ? '#0B2028' : '#ECFEFF',
                        borderColor: border,
                      },
                    ]}
                  >
                    <Text style={[styles.farmCountNum, { color: HEADER_BG }]}>
                      {(farmsByFarmer[f.id] ?? []).length}
                    </Text>
                    <Text style={[styles.farmCountLabel, { color: textMuted }]}>farms</Text>
                  </View>
                  <ChevronRight size={16} color={textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          /* STEP 2 — Farms list */
          <View style={{ flex: 1 }}>
            <View
              style={[
                styles.identityStrip,
                { backgroundColor: card, borderBottomColor: border },
              ]}
            >
              <View
                style={[
                  styles.identityAvatar,
                  { backgroundColor: avatarColor(selectedFarmer.idx) },
                ]}
              >
                <Text style={styles.farmerAvatarText}>
                  {getInitials(selectedFarmer.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.identityName, { color: textPrimary }]}>
                  {selectedFarmer.name}
                </Text>
                <Text style={[styles.identitySub, { color: HEADER_BG }]}>
                  {selectedFarmer.lfid} · Brgy. {selectedFarmer.barangay}
                </Text>
              </View>
            </View>

            {farmerFarms.length > 0 && (
              <View
                style={[
                  styles.statsStrip,
                  {
                    backgroundColor: isDark ? '#0B2028' : '#F0FDFE',
                    borderBottomColor: border,
                  },
                ]}
              >
                <StatPill label="Farms" value={farmerFarms.length} color={HEADER_BG} />
                <View style={[styles.statDiv, { backgroundColor: border }]} />
                <StatPill label="Parcels" value={totalParcels} color="#16A34A" />
                <View style={[styles.statDiv, { backgroundColor: border }]} />
                <StatPill
                  label="Total ha"
                  value={`${totalArea.toFixed(2)}`}
                  color="#7C3AED"
                  isStr
                />
                <View style={[styles.statDiv, { backgroundColor: border }]} />
                <StatPill label="Pending Sync" value={unsyncedCount} color="#EF4444" />
              </View>
            )}

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.farmListContent}
              showsVerticalScrollIndicator={false}
            >
              {farmerFarms.length === 0 && (
                <View style={styles.emptyWrap}>
                  <Layers size={44} color={HEADER_BG} style={{ opacity: 0.35 }} />
                  <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                    No farms registered yet
                  </Text>
                  <Text style={[styles.emptyDesc, { color: textMuted }]}>
                    Tap "+ Add Farm" to register a geotagged farm for this farmer.
                  </Text>
                </View>
              )}

              {farmerFarms.map((farm) => {
                const usedArea = farm.parcels.reduce(
                  (s, p) => s + parseFloat(p.area || '0'),
                  0
                );
                const remaining = parseFloat(farm.totalArea || '0') - usedArea;
                const fillPct =
                  parseFloat(farm.totalArea || '0') > 0
                    ? Math.min(1, usedArea / parseFloat(farm.totalArea))
                    : 0;
                return (
                  <View
                    key={farm.id}
                    style={[styles.farmCard, { backgroundColor: card, borderColor: border }]}
                  >
                    <TouchableOpacity
                      style={styles.farmCardHead}
                      onPress={() => toggleExpand(farm.id)}
                      activeOpacity={0.82}
                    >
                      <View
                        style={[
                          styles.farmIconBg,
                          { backgroundColor: isDark ? '#0B2028' : '#ECFEFF' },
                        ]}
                      >
                        <Layers size={20} color={HEADER_BG} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        >
                          <Text
                            style={[styles.farmCardName, { color: textPrimary }]}
                            numberOfLines={1}
                          >
                            {farm.name}
                          </Text>
                          {!farm.synced && <WifiOff size={12} color="#F59E0B" />}
                        </View>
                        <Text style={[styles.farmCardMeta, { color: textMuted }]}>
                          {farm.fid} · Brgy. {farm.barangay} · {farm.totalArea} ha ·{' '}
                          {farm.tenure}
                        </Text>
                        <View style={[styles.progressTrack, { backgroundColor: border }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.round(fillPct * 100)}%` as any,
                                backgroundColor: fillPct >= 0.9 ? '#EF4444' : HEADER_BG,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressLabel, { color: textMuted }]}>
                          {usedArea.toFixed(2)} /{' '}
                          {parseFloat(farm.totalArea || '0').toFixed(2)} ha used ·{' '}
                          {remaining.toFixed(2)} ha remaining
                        </Text>
                      </View>
                      <ChevronDown
                        size={18}
                        color={textMuted}
                        style={{
                          transform: [{ rotate: farm.expanded ? '180deg' : '0deg' }],
                        }}
                      />
                    </TouchableOpacity>

                    {farm.expanded && (
                      <View style={[styles.parcelSection, { borderTopColor: border }]}>
                        {farm.parcels.length === 0 ? (
                          <Text style={[styles.noParcelText, { color: textMuted }]}>
                            No parcels yet. Add one below.
                          </Text>
                        ) : (
                          farm.parcels.map((parcel, pi) => (
                            <View
                              key={parcel.id}
                              style={[
                                styles.parcelRow,
                                { borderBottomColor: border },
                                pi === farm.parcels.length - 1 && { borderBottomWidth: 0 },
                              ]}
                            >
                              <View
                                style={[
                                  styles.parcelIconBg,
                                  { backgroundColor: isDark ? '#0B2028' : '#F0FDF4' },
                                ]}
                              >
                                <Sprout size={14} color="#16A34A" />
                              </View>
                              <View style={{ flex: 1, gap: 1 }}>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                >
                                  <Text style={[styles.parcelFpid, { color: HEADER_BG }]}>
                                    {parcel.fpid}
                                  </Text>
                                  {!parcel.synced && <WifiOff size={10} color="#F59E0B" />}
                                </View>
                                <Text style={[styles.parcelInfo, { color: textPrimary }]}>
                                  {parcel.commodity} · {parcel.variety}
                                </Text>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                >
                                  <Text style={[styles.parcelArea, { color: textMuted }]}>
                                    {parcel.area} ha
                                  </Text>
                                  {parcel.lat ? (
                                    <View style={styles.gpsBadge}>
                                      <MapPin size={9} color="#16A34A" />
                                      <Text style={styles.gpsBadgeText}>
                                        {parcel.lat}, {parcel.lng}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              </View>
                              <TouchableOpacity
                                onPress={() => deleteParcel(farm.id, parcel.id)}
                                style={styles.deleteBtn}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Trash2 size={14} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                        <TouchableOpacity
                          style={[styles.addParcelBtn, { borderColor: HEADER_BG }]}
                          onPress={() => {
                            setTargetFarm(farm);
                            resetParcelForm();
                            setShowAddParcel(true);
                          }}
                        >
                          <Plus size={14} color={HEADER_BG} />
                          <Text style={[styles.addParcelText, { color: HEADER_BG }]}>
                            Add Geotagged Parcel
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <View style={[styles.fabWrap, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity
                style={[styles.fab, { backgroundColor: HEADER_BG }]}
                onPress={() => {
                  resetFarmForm();
                  setShowAddFarm(true);
                }}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.fabText}>Add Farm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ADD FARM MODAL */}
        <Modal
          visible={showAddFarm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddFarm(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAddFarm(false)}
            >
              <View
                style={[styles.modalSheet, { backgroundColor: card, borderColor: border }]}
                onStartShouldSetResponder={() => true}
              >
                <View style={[styles.modalHandle, { backgroundColor: border }]} />
                <View style={[styles.modalHead, { borderBottomColor: border }]}>
                  <Layers size={20} color={HEADER_BG} />
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>
                    Register New Farm (Offline SQLite)
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddFarm(false)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color={textMuted} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  contentContainerStyle={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <FormField label="Farm Name *" error={farmErrors.farmName}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#041318' : '#F8FAFC',
                          borderColor: farmErrors.farmName ? '#EF4444' : border,
                          color: textPrimary,
                        },
                      ]}
                      placeholder="e.g., San Isidro Rice Field"
                      placeholderTextColor="#9CA3AF"
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                  </FormField>

                  <FormField label="Barangay *" error={farmErrors.farmBarangay}>
                    <SelectInput
                      value={farmBarangay}
                      placeholder="Select barangay"
                      onPress={() =>
                        openDropdown('Barangay', BARANGAYS, (v) => setFarmBarangay(v))
                      }
                      textColor={textPrimary}
                      bg={isDark ? '#041318' : '#F8FAFC'}
                      borderColor={farmErrors.farmBarangay ? '#EF4444' : border}
                    />
                  </FormField>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <FormField label="Total Area (ha) *" error={farmErrors.farmArea}>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#041318' : '#F8FAFC',
                              borderColor: farmErrors.farmArea ? '#EF4444' : border,
                              color: textPrimary,
                            },
                          ]}
                          placeholder="e.g., 2.5"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="decimal-pad"
                          value={farmArea}
                          onChangeText={setFarmArea}
                        />
                      </FormField>
                    </View>
                    <View style={{ flex: 1 }}>
                      <FormField label="Tenure Type *" error={farmErrors.farmTenure}>
                        <SelectInput
                          value={farmTenure}
                          placeholder="Select"
                          onPress={() =>
                            openDropdown('Tenure Type', TENURE_TYPES, (v) =>
                              setFarmTenure(v)
                            )
                          }
                          textColor={textPrimary}
                          bg={isDark ? '#041318' : '#F8FAFC'}
                          borderColor={farmErrors.farmTenure ? '#EF4444' : border}
                        />
                      </FormField>
                    </View>
                  </View>

                  <Text style={[styles.formLabel, { color: textPrimary }]}>
                    GPS Coordinates & Boundary Evidence
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.gpsBtn,
                        {
                          flex: 1,
                          backgroundColor: isDark ? '#041318' : '#F0FDFE',
                          borderColor: HEADER_BG,
                        },
                      ]}
                      onPress={() =>
                        captureRealGps(setFarmLat, setFarmLng, setGpsCapturing)
                      }
                      disabled={gpsCapturing}
                    >
                      <Navigation size={16} color={HEADER_BG} />
                      <Text style={[styles.gpsBtnText, { color: HEADER_BG }]}>
                        {gpsCapturing ? 'Acquiring GPS…' : 'Capture GPS'}
                      </Text>
                      {farmLat ? <CheckCircle2 size={14} color="#16A34A" /> : null}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.gpsBtn,
                        {
                          flex: 1,
                          backgroundColor: isDark ? '#041318' : '#F0FDF4',
                          borderColor: '#16A34A',
                        },
                      ]}
                      onPress={() => setShowEvidenceCamera(true)}
                    >
                      <Camera size={16} color="#16A34A" />
                      <Text style={[styles.gpsBtnText, { color: '#16A34A' }]}>
                        Photo ({farmEvidence.length})
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {farmLat ? (
                    <Text style={[styles.coordsText, { color: textMuted }]}>
                      Verified WGS84: {farmLat}° N, {farmLng}° E{' '}
                      {farmAcc ? `(±${farmAcc}m)` : ''}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: HEADER_BG }]}
                    onPress={handleAddFarm}
                  >
                    <Text style={styles.saveBtnText}>
                      Save Farm Offline & Queue Sync
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* ADD PARCEL MODAL */}
        <Modal
          visible={showAddParcel}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddParcel(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowAddParcel(false)}
            >
              <View
                style={[styles.modalSheet, { backgroundColor: card, borderColor: border }]}
                onStartShouldSetResponder={() => true}
              >
                <View style={[styles.modalHandle, { backgroundColor: border }]} />
                <View style={[styles.modalHead, { borderBottomColor: border }]}>
                  <Sprout size={20} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: textPrimary }]}>
                      New Farm Parcel
                    </Text>
                    {targetFarm && (
                      <Text style={[styles.modalSubtitle, { color: textMuted }]}>
                        {targetFarm.name} ({targetFarm.fid})
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAddParcel(false)}
                    style={styles.modalCloseBtn}
                  >
                    <X size={18} color={textMuted} />
                  </TouchableOpacity>
                </View>

                {targetFarm && (
                  <View
                    style={[
                      styles.areaInfo,
                      {
                        backgroundColor: isDark ? '#041318' : '#ECFEFF',
                        borderColor: border,
                      },
                    ]}
                  >
                    <Leaf size={14} color={HEADER_BG} />
                    <Text style={[styles.areaInfoText, { color: textMuted }]}>
                      Farm area: {targetFarm.totalArea} ha · Used:{' '}
                      {targetFarm.parcels
                        .reduce((s, p) => s + parseFloat(p.area || '0'), 0)
                        .toFixed(2)}{' '}
                      ha · Available:{' '}
                      {(
                        parseFloat(targetFarm.totalArea || '0') -
                        targetFarm.parcels.reduce(
                          (s, p) => s + parseFloat(p.area || '0'),
                          0
                        )
                      ).toFixed(2)}{' '}
                      ha
                    </Text>
                  </View>
                )}

                <ScrollView
                  contentContainerStyle={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <FormField label="Commodity *" error={parcelErrors.parcelComm}>
                    <SelectInput
                      value={parcelComm}
                      placeholder="Select commodity"
                      onPress={() =>
                        openDropdown('Commodity', COMMODITIES, (v) => {
                          setParcelComm(v);
                          setParcelVariety('');
                        })
                      }
                      textColor={textPrimary}
                      bg={isDark ? '#041318' : '#F8FAFC'}
                      borderColor={parcelErrors.parcelComm ? '#EF4444' : border}
                    />
                  </FormField>

                  <FormField label="Variety *" error={parcelErrors.parcelVariety}>
                    <SelectInput
                      value={parcelVariety}
                      placeholder={
                        parcelComm ? 'Select variety' : 'Select commodity first'
                      }
                      onPress={() =>
                        parcelComm &&
                        openDropdown('Variety', getVarieties(parcelComm), (v) =>
                          setParcelVariety(v)
                        )
                      }
                      textColor={textPrimary}
                      bg={isDark ? '#041318' : '#F8FAFC'}
                      borderColor={parcelErrors.parcelVariety ? '#EF4444' : border}
                    />
                  </FormField>

                  <FormField label="Parcel Area (ha) *" error={parcelErrors.parcelArea}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#041318' : '#F8FAFC',
                          borderColor: parcelErrors.parcelArea ? '#EF4444' : border,
                          color: textPrimary,
                        },
                      ]}
                      placeholder="e.g., 0.75"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={parcelArea}
                      onChangeText={setParcelArea}
                    />
                  </FormField>

                  <Text style={[styles.formLabel, { color: textPrimary }]}>
                    GPS Coordinates (Live GNSS)
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.gpsBtn,
                      {
                        backgroundColor: isDark ? '#041318' : '#F0FDF4',
                        borderColor: '#16A34A',
                      },
                    ]}
                    onPress={() =>
                      captureRealGps(setParcelLat, setParcelLng, setParcelGpsCap)
                    }
                    disabled={parcelGpsCap}
                  >
                    <Navigation size={16} color="#16A34A" />
                    <Text style={[styles.gpsBtnText, { color: '#16A34A' }]}>
                      {parcelGpsCap ? 'Acquiring GPS…' : 'Capture Live Parcel GPS'}
                    </Text>
                    {parcelLat ? <CheckCircle2 size={14} color="#16A34A" /> : null}
                  </TouchableOpacity>
                  {parcelLat ? (
                    <Text style={[styles.coordsText, { color: textMuted }]}>
                      {parcelLat}° N, {parcelLng}° E
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: '#16A34A' }]}
                    onPress={handleAddParcel}
                  >
                    <Text style={styles.saveBtnText}>Save Parcel Offline</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        {/* DROPDOWN PICKER MODAL */}
        <Modal
          visible={ddTarget !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setDdTarget(null)}
        >
          <TouchableOpacity
            style={styles.ddOverlay}
            activeOpacity={1}
            onPress={() => setDdTarget(null)}
          >
            <View
              style={[styles.ddSheet, { backgroundColor: card, borderColor: border }]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[styles.ddHead, { borderBottomColor: border }]}>
                <Text style={[styles.ddTitle, { color: textPrimary }]}>{ddTarget}</Text>
                <TouchableOpacity onPress={() => setDdTarget(null)}>
                  <X size={18} color={textMuted} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {ddOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.ddItem, { borderBottomColor: border }]}
                    onPress={() => {
                      ddOnSelect && ddOnSelect(opt);
                      setDdTarget(null);
                    }}
                  >
                    <Text style={[styles.ddItemText, { color: textPrimary }]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <GeotaggedCameraModal
          visible={showEvidenceCamera}
          onClose={() => setShowEvidenceCamera(false)}
          onEvidenceCaptured={(ev) => {
            setFarmEvidence((prev) => [...prev, ev]);
            if (ev.latitude && ev.longitude) {
              setFarmLat(ev.latitude.toFixed(6));
              setFarmLng(ev.longitude.toFixed(6));
              setFarmAcc(ev.accuracy);
            }
          }}
          activityType="farm_registration"
          activityLabel={`Farm Boundary Photo: ${farmName || 'New Farm'}`}
          farmerId={selectedFarmer?.id}
          farmerLfid={selectedFarmer?.lfid}
          farmerName={selectedFarmer?.name}
          expectedBarangay={farmBarangay || selectedFarmer?.barangay}
        />
      </View>
    </>
  );
}

/* ─── Sub-components ─── */
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
  isStr?: boolean;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel2}>{label}</Text>
      {children}
      {error ? <Text style={styles.formError}>{error}</Text> : null}
    </View>
  );
}

function SelectInput({
  value,
  placeholder,
  onPress,
  textColor,
  bg,
  borderColor,
}: any) {
  return (
    <TouchableOpacity
      style={[styles.input, styles.selectInput, { backgroundColor: bg, borderColor }]}
      onPress={onPress}
    >
      <Text
        style={[
          { flex: 1, fontSize: 14 },
          value ? { color: textColor } : { color: '#9CA3AF' },
        ]}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      <ChevronDown size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#0891B2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },
  qrBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerHint: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  pickerHintText: { fontSize: 12 },
  listContent: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 32, gap: 8 },
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  farmerName: { fontSize: 14, fontWeight: '700' },
  farmerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  farmCount: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  farmCountNum: { fontSize: 16, fontWeight: '800' },
  farmCountLabel: { fontSize: 9 },

  identityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  identityAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: { fontSize: 14, fontWeight: '700' },
  identitySub: { fontSize: 11, marginTop: 1 },

  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  statPill: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 1 },
  statDiv: { width: 1, height: 24 },

  farmListContent: { padding: 14, paddingBottom: 100, gap: 10 },
  emptyWrap: { alignItems: 'center', paddingTop: 56, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptyDesc: { fontSize: 13, textAlign: 'center', maxWidth: 240 },

  farmCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  farmCardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  farmIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmCardName: { fontSize: 14, fontWeight: '700', flex: 1 },
  farmCardMeta: { fontSize: 11 },
  progressTrack: { height: 4, borderRadius: 2, marginTop: 4 },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 10, marginTop: 2 },

  parcelSection: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 0,
  },
  parcelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  parcelIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelFpid: { fontSize: 11, fontWeight: '700' },
  parcelInfo: { fontSize: 12, fontWeight: '600' },
  parcelArea: { fontSize: 11 },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  gpsBadgeText: { fontSize: 9, fontWeight: '700', color: '#16A34A' },
  deleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  noParcelText: { fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  addParcelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
  },
  addParcelText: { fontSize: 13, fontWeight: '700' },

  fabWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16 },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  modalSubtitle: { fontSize: 11, marginTop: 1 },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { padding: 20, gap: 14, paddingBottom: 32 },
  areaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 20,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  areaInfoText: { fontSize: 11, flex: 1 },

  formRow: { flexDirection: 'row', gap: 12 },
  formField: { gap: 5 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  formLabel2: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  formError: { fontSize: 11, color: '#EF4444', marginTop: 2 },
  input: {
    height: 46,
    borderRadius: 13,
    borderWidth: 1.5,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  selectInput: { flexDirection: 'row', alignItems: 'center' },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  gpsBtnText: { fontSize: 13, fontWeight: '600', flex: 1 },
  coordsText: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  ddOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  ddSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '55%',
    paddingBottom: 20,
  },
  ddHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  ddTitle: { fontSize: 16, fontWeight: '700' },
  ddItem: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1 },
  ddItemText: { fontSize: 14, fontWeight: '500' },
});
