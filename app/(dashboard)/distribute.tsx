import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Dimensions, Animated, PanResponder, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Path } from 'react-native-svg';
import { useColorScheme } from 'nativewind';
import {
  ChevronLeft, Package, Search, CheckCircle, Clock, XCircle,
  Check, Calendar, Users, MapPin, Camera, PenTool,
  X, Shield, UserCheck, Info, RotateCcw,
  QrCode, ShieldAlert, FileCheck2, Layers
} from 'lucide-react-native';
import {
  getAllDistributionData,
  recordAssistanceDistributionOffline,
  subscribeDatabaseChanges,
  LocalDistributionBatch,
  LocalDistributionAllocation,
  FieldEvidenceRecord,
} from '@/lib/db/database';
import {
  verifyBeneficiaryForDistribution,
  DistributionVerificationResult,
} from '@/lib/services/qrService';
import { acquireVerifiedLocation, VerifiedLocationResult } from '@/lib/services/evidenceService';
import { useAuth } from '@/lib/auth/useAuth';
import { GeotaggedCameraModal } from '@/components/evidence/GeotaggedCameraModal';

const { height } = Dimensions.get('window');

export default function DistributeAssistanceScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(
    () => ({
      background: isDark ? '#0A1A0F' : '#F8FAFC',
      surface: isDark ? '#0F2A1A' : '#FFFFFF',
      border: isDark ? '#1F3A28' : '#E2E8F0',
      text: isDark ? '#ECFDF5' : '#0F172A',
      textSecondary: isDark ? '#94A3B8' : '#64748B',
      primary: '#16A34A',
    }),
    [isDark]
  );

  const router = useRouter();
  const { user } = useAuth();
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();

  // SQLite Data State
  const [batches, setBatches] = useState<LocalDistributionBatch[]>([]);
  const [allocations, setAllocations] = useState<LocalDistributionAllocation[]>([]);

  const loadData = async () => {
    const data = await getAllDistributionData();
    setBatches(data.batches);
    setAllocations(data.allocations);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeDatabaseChanges(() => {
      loadData();
    });
    return unsub;
  }, []);

  // Screen Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Batch Modal State
  const [selBatchId, setSelBatchId] = useState<string | null>(null);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [benSearch, setBenSearch] = useState('');
  const [benStatusFilter, setBenStatusFilter] = useState('All');

  const selBatch = useMemo(
    () => batches.find((b) => b.id === selBatchId) || null,
    [batches, selBatchId]
  );

  // Confirm Distribution Modal State
  const [selAlloc, setSelAlloc] = useState<LocalDistributionAllocation | null>(null);
  const [distModalVisible, setDistModalVisible] = useState(false);
  const [actualQty, setActualQty] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [ackType, setAckType] = useState<'electronic_signature' | 'thumbmark_witnessed' | 'id_presented'>('electronic_signature');

  // Secondary Identity Verification State
  const [secondaryIdConfirmed, setSecondaryIdConfirmed] = useState(false);
  const [secondaryVerifyNote, setSecondaryVerifyNote] = useState('');

  // QR Verification Modal inside Batch
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrScanLock, setQrScanLock] = useState(false);
  const [verificationResult, setVerificationResult] = useState<DistributionVerificationResult | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');

  // Geotagged Evidence & GPS State
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [evidenceList, setEvidenceList] = useState<FieldEvidenceRecord[]>([]);
  const [geoResult, setGeoResult] = useState<VerifiedLocationResult | null>(null);
  const [acquiringGps, setAcquiringGps] = useState(false);

  // Signature State
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const currentPathRef = useRef('');

  // Toast State
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 60, duration: 300, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(toastAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter === 'Active' && b.status === 'completed') return false;
      if (statusFilter === 'Completed' && b.status !== 'completed') return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.commodity.toLowerCase().includes(q) ||
          b.barangay.toLowerCase().includes(q) ||
          b.batch_no.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [batches, searchQuery, statusFilter]);

  // Filtered Allocations for Selected Batch
  const batchAllocations = useMemo(() => {
    if (!selBatch) return [];
    return allocations.filter((a) => {
      if (a.batch_id !== selBatch.id) return false;
      if (benStatusFilter === 'Pending' && a.status !== 'pending') return false;
      if (benStatusFilter === 'Distributed' && a.status !== 'distributed') return false;
      if (benSearch.trim() !== '') {
        const q = benSearch.toLowerCase();
        return (
          a.farmer_name.toLowerCase().includes(q) ||
          a.lfid.toLowerCase().includes(q) ||
          a.rsbsa_number.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allocations, selBatch, benSearch, benStatusFilter]);

  // Summary Stats for Selected Batch
  const batchStats = useMemo(() => {
    if (!selBatch) return { total: 0, dist: 0, pend: 0 };
    const all = allocations.filter((a) => a.batch_id === selBatch.id);
    const dist = all.filter((a) => a.status === 'distributed').length;
    const pend = all.filter((a) => a.status === 'pending').length;
    return { total: all.length, dist, pend };
  }, [allocations, selBatch]);

  // Open Batch Details
  const openBatch = (batch: LocalDistributionBatch) => {
    setSelBatchId(batch.id);
    setBenSearch('');
    setBenStatusFilter('All');
    setVerificationResult(null);
    setBatchModalVisible(true);
  };

  // Open Distribution Form
  const openDistribute = async (
    alloc: LocalDistributionAllocation,
    fromQrVerification?: DistributionVerificationResult
  ) => {
    setSelAlloc(alloc);
    setActualQty(String(alloc.allocated_qty));
    setLotNumber(alloc.lot_number || (selBatch ? `LOT-${selBatch.batch_no.slice(-6)}` : 'LOT-2026-A'));
    setRemarks(alloc.remarks || '');
    setAckType('electronic_signature');
    setSecondaryIdConfirmed(false);
    setSecondaryVerifyNote('');
    setEvidenceList([]);
    setPaths([]);
    setCurrentPath('');
    currentPathRef.current = '';
    if (fromQrVerification) {
      setVerificationResult(fromQrVerification);
    } else if (selBatch) {
      const res = await verifyBeneficiaryForDistribution(alloc.lfid, selBatch.id);
      setVerificationResult(res);
    }
    setDistModalVisible(true);

    setAcquiringGps(true);
    try {
      const loc = await acquireVerifiedLocation();
      setGeoResult(loc);
    } catch {
      // handled gracefully
    } finally {
      setAcquiringGps(false);
    }
  };

  // Handle QR Scan inside Batch Modal
  const handleQrScanned = async (rawQr: string) => {
    if (qrScanLock || !selBatch) return;
    setQrScanLock(true);
    try {
      const result = await verifyBeneficiaryForDistribution(rawQr, selBatch.id);
      setVerificationResult(result);
    } finally {
      setTimeout(() => {
        setQrScanLock(false);
      }, 2200);
    }
  };

  const openQrScannerModal = async () => {
    if (!cameraPerm?.granted) {
      await requestCameraPerm();
    }
    setVerificationResult(null);
    setManualQrInput('');
    setQrModalVisible(true);
  };

  // Signature PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newP = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        currentPathRef.current = newP;
        setCurrentPath(newP);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const updated = `${currentPathRef.current} L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        currentPathRef.current = updated;
        setCurrentPath(updated);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current) {
          const finalPath = currentPathRef.current;
          setPaths((prev) => [...prev, finalPath]);
          currentPathRef.current = '';
          setCurrentPath('');
        }
      },
    })
  ).current;

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
    currentPathRef.current = '';
  };

  // Submit Distribution Transaction (Offline-First)
  const submitDistribution = async () => {
    if (!selAlloc || !selBatch) return;

    const qtyNum = parseFloat(actualQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid positive quantity to release.');
      return;
    }

    if (qtyNum > selBatch.remaining_stock) {
      Alert.alert(
        'Offline Stock Allocation Limit Reached',
        `Cannot release ${qtyNum} ${selAlloc.unit}. Only ${selBatch.remaining_stock} ${selBatch.unit} remaining in offline batch allocation.`
      );
      return;
    }

    if (!secondaryIdConfirmed) {
      Alert.alert(
        'Secondary Identity Verification Required',
        'Possession of a QR code alone does not establish identity. Please verify the beneficiary’s secondary identifier (Birth Year / RSBSA / Physical ID) and check the confirmation box.'
      );
      return;
    }

    if (ackType === 'electronic_signature' && paths.length === 0) {
      Alert.alert(
        'Recipient Acknowledgement Required',
        'Please ask the receiving farmer to sign in the signature pad, or select a documented alternative acknowledgement.'
      );
      return;
    }

    try {
      let sigUri: string | null = null;
      if (paths.length > 0 && FileSystem.documentDirectory) {
        const sigDir = `${FileSystem.documentDirectory}signatures/`;
        const dirInfo = await FileSystem.getInfoAsync(sigDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(sigDir, { intermediates: true });
        }
        sigUri = `${sigDir}sig_${selAlloc.id}_${Date.now()}.svg.json`;
        await FileSystem.writeAsStringAsync(
          sigUri,
          JSON.stringify({
            allocation_id: selAlloc.id,
            lfid: selAlloc.lfid,
            farmer_name: selAlloc.farmer_name,
            captured_at: new Date().toISOString(),
            paths,
          })
        );
      }

      const latestEvidence = evidenceList[0] || null;
      const gpsLat = latestEvidence?.latitude ?? geoResult?.latitude ?? 7.3082;
      const gpsLng = latestEvidence?.longitude ?? geoResult?.longitude ?? 125.6842;
      const gpsAcc = latestEvidence?.accuracy ?? geoResult?.accuracy ?? 4.5;

      await recordAssistanceDistributionOffline({
        allocation_id: selAlloc.id,
        batch_id: selBatch.id,
        actual_qty: qtyNum,
        lot_number: lotNumber.trim() || `LOT-${selBatch.batch_no.slice(-6)}`,
        qr_verified: true,
        secondary_verified: secondaryIdConfirmed,
        secondary_verification_method: secondaryVerifyNote.trim() || 'Birth Year / RSBSA Suffix Verified',
        signature_uri: sigUri,
        acknowledgement_type: ackType,
        latitude: gpsLat,
        longitude: gpsLng,
        gps_accuracy: gpsAcc,
        gps_mocked: Boolean(latestEvidence?.is_mock_location || geoResult?.isMocked),
        gps_exception_reason: latestEvidence?.gps_exception_reason || null,
        detected_barangay: latestEvidence?.detected_barangay || geoResult?.detectedBarangay || selBatch.barangay,
        barangay_verified: Boolean(latestEvidence?.barangay_verified ?? geoResult?.barangaySpatiallyVerified),
        remarks: remarks.trim(),
        technician_id: user?.id || 'TECH-001',
        technician_name: user?.name || 'Juan Dela Cruz',
        evidence_ids: evidenceList.map((e) => e.evidence_id),
      });

      setDistModalVisible(false);
      setQrModalVisible(false);
      await loadData();
      showToast(`Saved as Pending Sync (${selAlloc.farmer_name})`);
    } catch (err: any) {
      Alert.alert('Distribution Blocked', err?.message || 'Failed to save offline distribution.');
    }
  };

  const getBatchStatusColor = (status: LocalDistributionBatch['status']) => {
    switch (status) {
      case 'open':
      case 'ongoing':
        return { bg: isDark ? '#064e3b' : '#dcfce7', text: '#16a34a', label: status === 'open' ? 'Open' : 'Ongoing', icon: Clock };
      case 'completed':
        return { bg: isDark ? '#1e3a8a' : '#dbeafe', text: '#2563eb', label: 'Completed', icon: CheckCircle };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: status, icon: Info };
    }
  };

  const getAllocStatusColor = (status: LocalDistributionAllocation['status'], syncStatus?: string) => {
    if (status === 'distributed') {
      if (syncStatus === 'pending_sync') {
        return { bg: isDark ? '#78350f' : '#fef3c7', text: '#d97706', label: 'Distributed (Pending Sync)' };
      }
      return { bg: isDark ? '#064e3b' : '#dcfce7', text: '#16a34a', label: 'Distributed (Synced)' };
    }
    if (status === 'pending') {
      return { bg: isDark ? '#1e293b' : '#f1f5f9', text: '#3b82f6', label: 'Eligible / Pending' };
    }
    return { bg: isDark ? '#7f1d1d' : '#fee2e2', text: '#dc2626', label: status };
  };

  const isVerificationEligible =
    verificationResult?.status === 'eligible' ||
    verificationResult?.status === 'duplicate_scan_cooldown';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Floating Toast */}
      <Animated.View style={[styles.toast, { backgroundColor: '#15803d', transform: [{ translateY: toastAnim }] }]}>
        <CheckCircle size={18} color="#fff" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Distribute Assistance</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            QR-Verified Agricultural Distribution & Offline Stock Control
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        {/* Search & Filters */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search program, commodity, or barangay..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ChipScroll} contentContainerStyle={{ gap: 8 }}>
            {['All', 'Active', 'Completed'].map((st) => {
              const active = statusFilter === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{st}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Batch List */}
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredBatches.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No distribution batches found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try adjusting your filters or search query.</Text>
            </View>
          ) : (
            filteredBatches.map((batch) => {
              const stColor = getBatchStatusColor(batch.status);
              const StatusIcon = stColor.icon;

              const bAllocs = allocations.filter((a) => a.batch_id === batch.id);
              const bDist = bAllocs.filter((a) => a.status === 'distributed').length;
              const bPendSync = bAllocs.filter((a) => a.sync_status === 'pending_sync').length;
              const progress = batch.total_farmers > 0 ? bDist / batch.total_farmers : 0;

              return (
                <TouchableOpacity
                  key={batch.id}
                  style={[styles.batchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => openBatch(batch)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.BatchNoWrap}>
                      <Text style={[styles.batchNo, { color: colors.textSecondary }]}>{batch.batch_no}</Text>
                      {bPendSync > 0 && (
                        <View style={[styles.statusBadge, { backgroundColor: '#fef3c7', marginLeft: 8 }]}>
                          <Clock size={11} color="#d97706" />
                          <Text style={[styles.statusText, { color: '#d97706' }]}>{bPendSync} Pending Sync</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: stColor.bg }]}>
                      <StatusIcon size={12} color={stColor.text} />
                      <Text style={[styles.statusText, { color: stColor.text }]}>{stColor.label}</Text>
                    </View>
                  </View>

                  <Text style={[styles.progName, { color: colors.text }]}>{batch.title}</Text>

                  <View style={styles.commRow}>
                    <View style={[styles.commBadge, { backgroundColor: '#16a34a20' }]}>
                      <Package size={14} color="#16a34a" />
                      <Text style={[styles.commType, { color: '#16a34a' }]}>{batch.unit}</Text>
                    </View>
                    <Text style={[styles.commName, { color: colors.text }]} numberOfLines={1}>
                      {batch.commodity}
                    </Text>
                  </View>

                  <View style={[styles.metaGrid, { borderTopColor: colors.border }]}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{batch.release_date}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MapPin size={14} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>Brgy. {batch.barangay}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Layers size={14} color={colors.primary} />
                      <Text style={[styles.metaText, { color: colors.primary, fontWeight: '700' }]}>
                        Stock: {batch.remaining_stock}/{batch.total_stock} {batch.unit}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progSection}>
                    <View style={styles.progLabelRow}>
                      <Text style={[styles.progLabel, { color: colors.textSecondary }]}>Beneficiaries Served</Text>
                      <Text style={[styles.progVal, { color: colors.text }]}>
                        {bDist} of {batch.total_farmers} ({Math.round(progress * 100)}%)
                      </Text>
                    </View>
                    <View style={[styles.progTrack, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                      <View
                        style={[
                          styles.progFill,
                          {
                            width: `${Math.min(100, progress * 100)}%`,
                            backgroundColor: batch.status === 'completed' ? '#2563eb' : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* ========================================================================= */}
      {/* BATCH DETAILS & BENEFICIARY LIST MODAL                                    */}
      {/* ========================================================================= */}
      <Modal visible={batchModalVisible} animationType="slide" onRequestClose={() => setBatchModalVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
          {selBatch && (
            <View style={{ flex: 1 }}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setBatchModalVisible(false)} style={styles.backBtn}>
                  <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                    {selBatch.title}
                  </Text>
                  <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                    {selBatch.batch_no} • Brgy. {selBatch.barangay}
                  </Text>
                </View>
                {selBatch.status !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.scanQrHeaderBtn, { backgroundColor: colors.primary }]}
                    onPress={openQrScannerModal}
                  >
                    <QrCode size={16} color="#fff" />
                    <Text style={styles.scanQrHeaderBtnText}>Scan QR</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Summary Strip */}
              <View style={[styles.summaryStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: colors.text }]}>{batchStats.total}</Text>
                  <Text style={[styles.statLab, { color: colors.textSecondary }]}>Approved</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#16a34a' }]}>{batchStats.dist}</Text>
                  <Text style={[styles.statLab, { color: colors.textSecondary }]}>Distributed</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#d97706' }]}>{batchStats.pend}</Text>
                  <Text style={[styles.statLab, { color: colors.textSecondary }]}>Remaining</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: colors.primary }]}>
                    {selBatch.remaining_stock}
                  </Text>
                  <Text style={[styles.statLab, { color: colors.textSecondary }]}>Stock Left</Text>
                </View>
              </View>

              {/* Prominent QR Scan Call-to-Action Banner */}
              {selBatch.status !== 'completed' && (
                <TouchableOpacity
                  style={[styles.qrCalloutBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                  onPress={openQrScannerModal}
                >
                  <View style={[styles.qrCalloutIcon, { backgroundColor: colors.primary }]}>
                    <QrCode size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.qrCalloutTitle, { color: colors.text }]}>
                      Scan Farmer AgroProfiler QR Credential
                    </Text>
                    <Text style={[styles.qrCalloutSub, { color: colors.textSecondary }]}>
                      Verifies digital signature, approved beneficiary list, duplicate scan lock & remaining stock.
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Beneficiary Filter Controls */}
              <View style={styles.benFilterWrap}>
                <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 8 }]}>
                  <Search size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search beneficiary name, LFID, or RSBSA..."
                    placeholderTextColor={colors.textSecondary}
                    value={benSearch}
                    onChangeText={setBenSearch}
                  />
                  {benSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setBenSearch('')}>
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {['All', 'Pending', 'Distributed'].map((st) => {
                    const active = benStatusFilter === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.surface,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setBenStatusFilter(st)}
                      >
                        <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{st}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Beneficiary List */}
              <ScrollView contentContainerStyle={styles.benList} showsVerticalScrollIndicator={false}>
                {batchAllocations.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Users size={40} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 16 }]}>No beneficiaries match</Text>
                  </View>
                ) : (
                  batchAllocations.map((alloc) => {
                    const stColor = getAllocStatusColor(alloc.status, alloc.sync_status);
                    const isPending = alloc.status === 'pending';

                    return (
                      <View key={alloc.id} style={[styles.benCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.benTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.benName, { color: colors.text }]}>{alloc.farmer_name}</Text>
                            <Text style={[styles.benIds, { color: colors.textSecondary }]}>
                              {alloc.lfid} • RSBSA: {alloc.rsbsa_number}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: stColor.bg }]}>
                            <Text style={[styles.statusText, { color: stColor.text }]}>{stColor.label}</Text>
                          </View>
                        </View>

                        <View style={[styles.allocStrip, { backgroundColor: isDark ? '#1f2937' : '#f9fafb', borderColor: colors.border }]}>
                          <View>
                            <Text style={[styles.allocLab, { color: colors.textSecondary }]}>Allocated Qty</Text>
                            <Text style={[styles.allocVal, { color: colors.text }]}>
                              {alloc.allocated_qty} {alloc.unit}
                            </Text>
                          </View>
                          {alloc.status === 'distributed' && (
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.allocLab, { color: colors.textSecondary }]}>Released / Lot</Text>
                              <Text style={[styles.allocVal, { color: '#16a34a' }]}>
                                {alloc.actual_qty} {alloc.unit} ({alloc.lot_number || 'N/A'})
                              </Text>
                            </View>
                          )}
                        </View>

                        {alloc.status === 'distributed' && alloc.distributed_at && (
                          <View style={styles.distMeta}>
                            <CheckCircle size={14} color="#16a34a" />
                            <Text style={[styles.distMetaText, { color: colors.textSecondary }]}>
                              Released {new Date(alloc.distributed_at).toLocaleString()} by {alloc.distributed_by_name || 'Technician'}
                            </Text>
                          </View>
                        )}

                        {/* Action Button */}
                        {isPending && selBatch.status !== 'completed' && (
                          <TouchableOpacity
                            style={[styles.distBtn, { backgroundColor: colors.primary }]}
                            onPress={() => openDistribute(alloc)}
                          >
                            <UserCheck size={16} color="#fff" />
                            <Text style={styles.distBtnText}>Verify & Distribute</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* ========================================================================= */}
      {/* QR SCANNER & ELIGIBILITY VERIFICATION MODAL                               */}
      {/* ========================================================================= */}
      <Modal visible={qrModalVisible} animationType="slide" transparent onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.formSheet, { backgroundColor: colors.background, height: height * 0.88 }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Scan Farmer Identification QR</Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  {selBatch?.title} ({selBatch?.batch_no})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Live Camera QR Scanner */}
              <View style={styles.qrScannerBox}>
                {cameraPerm?.granted ? (
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={({ data }) => {
                      if (data) handleQrScanned(data);
                    }}
                  />
                ) : (
                  <View style={styles.qrPermFallback}>
                    <QrCode size={40} color="#fff" />
                    <Text style={{ color: '#fff', marginTop: 8, textAlign: 'center' }}>
                      Camera permission is required to scan AgroProfiler QR credentials.
                    </Text>
                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: colors.primary, marginTop: 12, paddingHorizontal: 16 }]}
                      onPress={requestCameraPerm}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Grant Camera Access</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.qrFrameOverlay} />
              </View>

              {/* Simulator / Quick-Test QR Credential Buttons */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12, marginBottom: 6 }]}>
                Offline Test Credentials (Tap to Simulate QR Scan):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Eligible: Juan (LFID-2026-001)', qr: 'AGROQR:v1:LFID-2026-001:11-23-04-001-000101:SIG8891A' },
                  { label: 'Eligible: Pedro (LFID-2026-003)', qr: 'AGROQR:v1:LFID-2026-003:11-23-04-003-000103:SIG4412C' },
                  { label: 'Already Claimed: Elena (LFID-2026-006)', qr: 'AGROQR:v1:LFID-2026-006:11-23-04-001-000106:SIG5531F' },
                  { label: 'Other Batch: Maria (LFID-2026-002)', qr: 'AGROQR:v1:LFID-2026-002:11-23-04-002-000102:SIG9920B' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleQrScanned(item.qr)}
                  >
                    <QrCode size={13} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Manual LFID / QR Fallback Input */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Or enter LFID / QR string manually..."
                  placeholderTextColor={colors.textSecondary}
                  value={manualQrInput}
                  onChangeText={setManualQrInput}
                />
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 0, paddingHorizontal: 16, backgroundColor: colors.primary }]}
                  onPress={() => {
                    if (manualQrInput.trim()) handleQrScanned(manualQrInput.trim());
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Verify</Text>
                </TouchableOpacity>
              </View>

              {/* Verification Result Card */}
              {verificationResult && (
                <View
                  style={[
                    styles.verifyResultCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isVerificationEligible ? '#16a34a' : '#dc2626',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {isVerificationEligible ? (
                      <CheckCircle size={22} color="#16a34a" />
                    ) : (
                      <ShieldAlert size={22} color="#dc2626" />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '800',
                          color: isVerificationEligible ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {isVerificationEligible
                          ? 'VERIFIED ELIGIBLE BENEFICIARY'
                          : `BLOCKED: ${verificationResult.status.replace(/_/g, ' ').toUpperCase()}`}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {verificationResult.message}
                      </Text>
                    </View>
                  </View>

                  {verificationResult.farmer && (
                    <View style={[styles.farmerIdentityBox, { borderTopColor: colors.border }]}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                        {verificationResult.farmer.first_name} {verificationResult.farmer.last_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        LFID: {verificationResult.farmer.lfid} • RSBSA: {verificationResult.farmer.rsbsa_number}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        Barangay: {verificationResult.farmer.barangay} • Secondary Verification Challenge:{' '}
                        <Text style={{ fontWeight: '700', color: colors.primary }}>
                          {verificationResult.secondaryChallengeHint}
                        </Text>
                      </Text>

                      {verificationResult.previousDistributions.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                            Previous Assistance History ({verificationResult.previousDistributions.length}):
                          </Text>
                          {verificationResult.previousDistributions.slice(0, 3).map((c: LocalDistributionAllocation) => (
                            <Text key={c.id} style={{ fontSize: 11, color: colors.textSecondary }}>
                              • {c.actual_qty} {c.unit} ({c.status}) — {c.distributed_at ? new Date(c.distributed_at).toLocaleDateString() : 'Pending'}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {isVerificationEligible && verificationResult.allocation && (
                    <TouchableOpacity
                      style={[styles.distBtn, { backgroundColor: '#16a34a', marginTop: 12 }]}
                      onPress={() => {
                        setQrModalVisible(false);
                        openDistribute(verificationResult.allocation!, verificationResult);
                      }}
                    >
                      <UserCheck size={16} color="#fff" />
                      <Text style={styles.distBtnText}>
                        Proceed to Release ({verificationResult.allocation.allocated_qty} {verificationResult.allocation.unit})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* CONFIRM DISTRIBUTION & ACKNOWLEDGEMENT MODAL                              */}
      {/* ========================================================================= */}
      <Modal visible={distModalVisible} animationType="fade" transparent onRequestClose={() => setDistModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.formSheet, { backgroundColor: colors.background, height: height * 0.92 }]}>
            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Confirm Assistance Release</Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  Saved as Pending Sync until reconciled with central server
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDistModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selAlloc && selBatch && (
              <ScrollView contentContainerStyle={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                {/* 1. Beneficiary Verification Summary */}
                <View style={[styles.verifyCard, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <View style={styles.verifyHeader}>
                    <Shield size={16} color="#16a34a" />
                    <Text style={styles.verifyTitle}>Approved Beneficiary & Eligibility Check</Text>
                  </View>
                  <Text style={[styles.verifyName, { color: colors.text }]}>{selAlloc.farmer_name}</Text>
                  <View style={styles.verifyGrid}>
                    <View style={styles.vItem}>
                      <Text style={styles.vLab}>LFID</Text>
                      <Text style={[styles.vVal, { color: colors.text }]}>{selAlloc.lfid}</Text>
                    </View>
                    <View style={styles.vItem}>
                      <Text style={styles.vLab}>RSBSA No.</Text>
                      <Text style={[styles.vVal, { color: colors.text }]}>{selAlloc.rsbsa_number}</Text>
                    </View>
                    <View style={styles.vItem}>
                      <Text style={styles.vLab}>Barangay</Text>
                      <Text style={[styles.vVal, { color: colors.text }]}>{selBatch.barangay}</Text>
                    </View>
                    <View style={styles.vItem}>
                      <Text style={styles.vLab}>Batch Remaining Stock</Text>
                      <Text style={[styles.vVal, { color: '#16a34a' }]}>
                        {selBatch.remaining_stock} {selBatch.unit}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. Mandatory Secondary Identity Verification */}
                <View style={[styles.secondaryIdBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setSecondaryIdConfirmed(!secondaryIdConfirmed)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: secondaryIdConfirmed ? colors.primary : 'transparent',
                          borderColor: secondaryIdConfirmed ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {secondaryIdConfirmed && <Check size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkboxTitle, { color: colors.text }]}>
                        Secondary Identity Verification Confirmed *
                      </Text>
                      <Text style={[styles.checkboxSub, { color: colors.textSecondary }]}>
                        {verificationResult?.secondaryChallengeHint ||
                          `Verify physical ID or RSBSA suffix (${selAlloc.rsbsa_number.slice(-4)}) in person.`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginTop: 8, height: 38 }]}
                    placeholder="Optional ID reference (e.g. Barangay ID / Birth Year Verified)"
                    placeholderTextColor={colors.textSecondary}
                    value={secondaryVerifyNote}
                    onChangeText={setSecondaryVerifyNote}
                  />
                </View>

                {/* 3. Commodity, Quantity & Batch/Lot Details */}
                <Text style={[styles.secTitle, { color: colors.text }]}>Distribution Details</Text>
                <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.readOnlyRow}>
                    <Text style={[styles.roLab, { color: colors.textSecondary }]}>Commodity</Text>
                    <Text style={[styles.roVal, { color: colors.text }]}>{selBatch.commodity}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.readOnlyRow}>
                    <Text style={[styles.roLab, { color: colors.textSecondary }]}>Allocated Quantity</Text>
                    <Text style={[styles.roVal, { color: colors.text }]}>
                      {selAlloc.allocated_qty} {selAlloc.unit}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      Actual Quantity Released ({selAlloc.unit}) *
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      keyboardType="numeric"
                      value={actualQty}
                      onChangeText={setActualQty}
                    />
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 12 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Batch / Lot Number *</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      value={lotNumber}
                      onChangeText={setLotNumber}
                      placeholder="e.g. LOT-RC222-88A"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 12 }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Remarks (Optional)</Text>
                    <TextInput
                      style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                      placeholder="Add notes if partial release or representative claim..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={2}
                      value={remarks}
                      onChangeText={setRemarks}
                    />
                  </View>
                </View>

                {/* 4. In-App Geotagged Photographic Evidence & GPS */}
                <Text style={[styles.secTitle, { color: colors.text }]}>Geotagged Field Evidence</Text>
                <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.gpsPill, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
                    <MapPin size={16} color="#16a34a" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#15803d', fontSize: 12, fontWeight: '700' }}>
                        {acquiringGps
                          ? 'Acquiring GNSS Coordinates...'
                          : `GPS: ${(evidenceList[0]?.latitude ?? geoResult?.latitude ?? 7.3082).toFixed(5)}° N, ${(evidenceList[0]?.longitude ?? geoResult?.longitude ?? 125.6842).toFixed(5)}° E (±${Math.round(evidenceList[0]?.accuracy ?? geoResult?.accuracy ?? 4.5)}m)`}
                      </Text>
                      <Text style={{ color: '#166534', fontSize: 11 }}>
                        Timestamp: {new Date().toLocaleString()} • Technician: {user?.name || 'Juan Dela Cruz'}
                      </Text>
                    </View>
                  </View>

                  {evidenceList.length === 0 ? (
                    <TouchableOpacity
                      style={[styles.photoBox, { borderColor: colors.border, backgroundColor: colors.background, marginTop: 10 }]}
                      onPress={() => setCameraModalVisible(true)}
                    >
                      <Camera size={26} color={colors.primary} />
                      <Text style={[styles.photoText, { color: colors.primary }]}>
                        Capture Geotagged Handover Photo (In-App Camera)
                      </Text>
                      <Text style={[styles.photoSub, { color: colors.textSecondary }]}>
                        Embeds GPS coordinates, SHA-256 hash & barangay verification
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.photoCapturedBox, { borderColor: '#16a34a', backgroundColor: isDark ? '#064e3b40' : '#f0fdf4', marginTop: 10 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <FileCheck2 size={22} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                            {evidenceList.length} Geotagged Evidence Photo(s) Attached
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 11 }} numberOfLines={1}>
                            SHA-256: {evidenceList[0].file_hash_sha256.slice(0, 20)}... • Brgy. {evidenceList[0].detected_barangay}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => setCameraModalVisible(true)}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Add Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* 5. Recipient Acknowledgement */}
                <View style={styles.sigHeaderRow}>
                  <Text style={[styles.secTitle, { color: colors.text, marginBottom: 0 }]}>
                    Recipient Acknowledgement *
                  </Text>
                  {ackType === 'electronic_signature' && (
                    <TouchableOpacity style={styles.clearSigBtn} onPress={clearSignature}>
                      <RotateCcw size={14} color={colors.textSecondary} />
                      <Text style={[styles.clearSigText, { color: colors.textSecondary }]}>Clear Pad</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginVertical: 8 }}>
                  {[
                    { key: 'electronic_signature', label: 'Electronic Signature' },
                    { key: 'thumbmark_witnessed', label: 'Thumbmark (Witnessed)' },
                    { key: 'id_presented', label: 'Signed Physical Receipt' },
                  ].map((opt) => {
                    const active = ackType === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.surface,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setAckType(opt.key as any)}
                      >
                        <Text style={[styles.chipText, { color: active ? '#fff' : colors.text }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {ackType === 'electronic_signature' && (
                  <>
                    <View
                      style={[
                        styles.sigCanvas,
                        { backgroundColor: '#fff', borderColor: paths.length > 0 ? '#16a34a' : colors.border },
                      ]}
                      {...panResponder.panHandlers}
                    >
                      <Svg style={StyleSheet.absoluteFill}>
                        {paths.map((p, idx) => (
                          <Path key={idx} d={p} stroke="#000" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        ))}
                        {currentPath ? (
                          <Path d={currentPath} stroke="#000" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        ) : null}
                      </Svg>
                      {paths.length === 0 && !currentPath && (
                        <View style={styles.sigPlaceholder} pointerEvents="none">
                          <PenTool size={24} color="#9ca3af" />
                          <Text style={styles.sigPlaceholderText}>Farmer signs here to acknowledge receipt</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.sigDisclaimer, { color: colors.textSecondary }]}>
                      By signing above, {selAlloc.farmer_name} acknowledges receipt of {actualQty || 0} {selAlloc.unit} of {selBatch.commodity}.
                    </Text>
                  </>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}

            {/* Sticky Action Footer */}
            <View style={[styles.sheetFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setDistModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={submitDistribution}
              >
                <Check size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Save Distribution (Offline-Safe)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Geotagged In-App Camera Modal */}
      <GeotaggedCameraModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        activityType="distribution"
        farmerId={selAlloc?.farmer_id}
        farmerLfid={selAlloc?.lfid}
        farmerName={selAlloc?.farmer_name}
        expectedBarangay={selBatch?.barangay}
        transactionId={selAlloc?.transaction_id}
        onEvidenceCaptured={(ev) => {
          setEvidenceList((prev) => [ev, ...prev]);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  toast: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 9999, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  container: { flex: 1 },
  filterSection: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  ChipScroll: { flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  listContainer: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  batchCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  BatchNoWrap: { flexDirection: 'row', alignItems: 'center' },
  batchNo: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700' },
  progName: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  commRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  commBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  commType: { fontSize: 11, fontWeight: '700' },
  commName: { fontSize: 13, fontWeight: '600', flex: 1 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 12, borderTopWidth: 1, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },
  progSection: { marginTop: 2 },
  progLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel: { fontSize: 12, fontWeight: '500' },
  progVal: { fontSize: 12, fontWeight: '700' },
  progTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 4 },
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalSub: { fontSize: 12, marginTop: 2 },
  scanQrHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  scanQrHeaderBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  summaryStrip: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '800' },
  statLab: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: '80%', alignSelf: 'center' },
  qrCalloutBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  qrCalloutIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qrCalloutTitle: { fontSize: 13, fontWeight: '700' },
  qrCalloutSub: { fontSize: 11, marginTop: 2 },
  benFilterWrap: { padding: 16, paddingBottom: 8 },
  benList: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  benCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  benTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  benName: { fontSize: 15, fontWeight: '700' },
  benIds: { fontSize: 12, marginTop: 2 },
  allocStrip: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  allocLab: { fontSize: 11 },
  allocVal: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  distMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  distMetaText: { fontSize: 11 },
  distBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8, marginTop: 4 },
  distBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
  sheetSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  sheetScroll: { padding: 20 },
  qrScannerBox: { height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  qrPermFallback: { padding: 20, alignItems: 'center' },
  qrFrameOverlay: { width: 150, height: 150, borderWidth: 2, borderColor: '#22c55e', borderRadius: 14 },
  verifyResultCard: { borderRadius: 12, borderWidth: 2, padding: 14 },
  farmerIdentityBox: { borderTopWidth: 1, marginTop: 8, paddingTop: 8 },
  verifyCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  verifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  verifyTitle: { color: '#16a34a', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  verifyName: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  verifyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vItem: { width: '45%' },
  vLab: { fontSize: 11, color: '#6b7280' },
  vVal: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  secondaryIdBox: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 18 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxTitle: { fontSize: 13, fontWeight: '700' },
  checkboxSub: { fontSize: 11, marginTop: 2 },
  secTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  formCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  readOnlyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  roLab: { fontSize: 13 },
  roVal: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  inputGroup: {},
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15, fontWeight: '600' },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, minHeight: 68, textAlignVertical: 'top' },
  gpsPill: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8 },
  photoBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center', justifyContent: 'center' },
  photoText: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  photoSub: { fontSize: 11, marginTop: 2 },
  photoCapturedBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, padding: 14 },
  sigHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearSigBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  clearSigText: { fontSize: 12, fontWeight: '600' },
  sigCanvas: { height: 150, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  sigPlaceholder: { alignItems: 'center', opacity: 0.6 },
  sigPlaceholderText: { color: '#6b7280', fontSize: 13, marginTop: 6, fontWeight: '500' },
  sigDisclaimer: { fontSize: 11, marginTop: 8, lineHeight: 16, textAlign: 'center' },
  sheetFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  submitBtn: { flex: 2, height: 48, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
