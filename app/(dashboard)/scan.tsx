import { useSidebar } from '@/lib/SidebarContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  CheckCircle,
  Keyboard,
  Menu,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Package,
  Leaf,
  AlertTriangle,
  X,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { resolveQrCodeOffline, ParsedAgroQr } from '@/lib/services/qrService';
import { LocalFarmer, LocalFarm, LocalDistributionAllocation } from '@/lib/db/database';

export default function ScanScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [resolvedInfo, setResolvedInfo] = useState<{
    parsed: ParsedAgroQr;
    farmer: LocalFarmer | null;
    farm: LocalFarm | null;
    allocations: LocalDistributionAllocation[];
  } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Animated scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const processQrCode = async (data: string) => {
    setScanned(true);
    setScannedData(data);
    const resolved = await resolveQrCodeOffline(data);
    setResolvedInfo(resolved);
    Vibration.vibrate(80);
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    processQrCode(data);
  };

  const handleOpenFarmerProfile = () => {
    if (!scannedData) return;
    const code = resolvedInfo?.farmer?.lfid || resolvedInfo?.parsed.identifier || scannedData;
    router.push({
      pathname: '/(dashboard)/farmer-profile',
      params: { code, id: resolvedInfo?.farmer?.id },
    } as any);
    setScanned(false);
    setScannedData(null);
    setResolvedInfo(null);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
    setResolvedInfo(null);
  };

  const handleManualLookup = () => {
    if (!manualCode.trim()) {
      Alert.alert('Empty Code', 'Please enter an LFID, FID, FPID, or signed QR string.');
      return;
    }
    setManualModalVisible(false);
    processQrCode(manualCode.trim());
    setManualCode('');
  };

  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const bg = '#0F172A';

  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF' }}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F0F7FF' }} edges={['top', 'left', 'right', 'bottom']}>
        <View style={[styles.header, { backgroundColor: '#16A34A' }]}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Menu size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ backgroundColor: '#FEF2F2', borderRadius: 20, padding: 24, alignItems: 'center' }}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={[styles.permDeniedTitle, { color: textPrimary }]}>Camera Access Required</Text>
            <Text style={[styles.permDeniedDesc, { color: textMuted }]}>
              Please grant camera permission to scan AgroProfiler QR credentials. You can still enter codes manually.
            </Text>
            <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
              <Text style={styles.grantBtnText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.manualBtnOutline, { borderColor: '#16A34A' }]} onPress={() => setManualModalVisible(true)}>
              <Text style={[styles.manualBtnOutlineText, { color: '#16A34A' }]}>Enter Code Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ManualEntryModal
          visible={manualModalVisible}
          onClose={() => setManualModalVisible(false)}
          value={manualCode}
          onChange={setManualCode}
          onSubmit={handleManualLookup}
          onQuickSelect={(code) => {
            setManualModalVisible(false);
            processQrCode(code);
          }}
          isDark={isDark}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={styles.scanHeader}>
          <TouchableOpacity onPress={openSidebar} style={styles.scanHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Menu size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.scanHeaderTitle}>Scan Farmer / Parcel QR</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.viewfinderWrapper} pointerEvents="none">
        <View style={styles.frameOuter}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {!scanned && (
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
            />
          )}
        </View>
        <Text style={styles.scanHint}>
          {scanned ? '' : 'Align AgroProfiler QR credential within the frame'}
        </Text>
      </View>

      {/* ── Scan Result & Offline Verification Overlay ── */}
      {scanned && scannedData && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            {resolvedInfo?.farmer ? (
              <CheckCircle size={40} color="#10B981" />
            ) : (
              <ShieldAlert size={40} color="#F59E0B" />
            )}

            <Text style={styles.resultTitle}>
              {resolvedInfo?.farmer
                ? `${resolvedInfo.farmer.first_name} ${resolvedInfo.farmer.last_name}`
                : 'QR Credential Decoded'}
            </Text>

            <View style={styles.resultCodeBox}>
              <Text style={styles.resultCode} numberOfLines={2}>
                {resolvedInfo?.parsed.identifier || scannedData}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                <ShieldCheck size={14} color={resolvedInfo?.parsed.isDigitallySigned ? '#16A34A' : '#2563EB'} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: resolvedInfo?.parsed.isDigitallySigned ? '#15803D' : '#1D4ED8' }}>
                  {resolvedInfo?.parsed.isDigitallySigned
                    ? 'Digitally Signed Credential (AGROQR:v1)'
                    : `Standard ${resolvedInfo?.parsed.entityType.toUpperCase() || 'QR'} Identifier`}
                </Text>
              </View>
            </View>

            {resolvedInfo?.farmer ? (
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginBottom: 10 }}>
                  Brgy. {resolvedInfo.farmer.barangay} • RSBSA: {resolvedInfo.farmer.rsbsa_number} • {resolvedInfo.allocations.length} Assistance Record(s)
                </Text>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: '#16A34A' }]}
                    onPress={() => {
                      handleScanAgain();
                      router.push('/(dashboard)/distribute' as any);
                    }}
                  >
                    <Package size={15} color="#FFF" />
                    <Text style={styles.quickActionText}>Distribute</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: '#2563EB' }]}
                    onPress={() => {
                      handleScanAgain();
                      router.push('/(dashboard)/crop-monitoring' as any);
                    }}
                  >
                    <Leaf size={15} color="#FFF" />
                    <Text style={styles.quickActionText}>Monitor</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickActionBtn, { backgroundColor: '#EA580C' }]}
                    onPress={() => {
                      handleScanAgain();
                      router.push('/(dashboard)/record-damage' as any);
                    }}
                  >
                    <AlertTriangle size={15} color="#FFF" />
                    <Text style={styles.quickActionText}>Damage</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 14 }}>
                No matching farmer found in local offline cache. You can still view or sync records.
              </Text>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={handleOpenFarmerProfile} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Open Farmer Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain} activeOpacity={0.85}>
              <RefreshCw size={16} color="#64748B" />
              <Text style={styles.scanAgainText}>Scan Another QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!scanned && (
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setTorchOn((v) => !v)}
              activeOpacity={0.8}
            >
              {torchOn ? <Zap size={22} color="#F59E0B" /> : <ZapOff size={22} color="#FFFFFF" />}
              <Text style={[styles.controlLabel, torchOn && { color: '#F59E0B' }]}>
                {torchOn ? 'Torch On' : 'Torch Off'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, styles.manualEntryBtn]}
              onPress={() => setManualModalVisible(true)}
              activeOpacity={0.8}
            >
              <Keyboard size={22} color="#FFFFFF" />
              <Text style={styles.controlLabel}>Enter / Test QR</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        value={manualCode}
        onChange={setManualCode}
        onSubmit={handleManualLookup}
        onQuickSelect={(code) => {
          setManualModalVisible(false);
          processQrCode(code);
        }}
        isDark={isDark}
      />
    </View>
  );
}

function ManualEntryModal({
  visible,
  onClose,
  value,
  onChange,
  onSubmit,
  onQuickSelect,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onQuickSelect: (code: string) => void;
  isDark: boolean;
}) {
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.modalSheet, { backgroundColor: card }]}>
          <View style={[styles.modalHandle, { backgroundColor: border }]} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Enter or Simulate QR Credential</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDesc, { color: textMuted }]}>
            Enter the farmer's LFID, FID, FPID, or tap an offline signed QR credential below:
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Juan (LFID-2026-001)', code: 'AGROQR:v1:LFID-2026-001:11-23-04-001-000101:SIG8891A' },
              { label: 'Maria (LFID-2026-002)', code: 'AGROQR:v1:LFID-2026-002:11-23-04-002-000102:SIG9920B' },
              { label: 'Pedro (LFID-2026-003)', code: 'AGROQR:v1:LFID-2026-003:11-23-04-003-000103:SIG4412C' },
              { label: 'Elena (LFID-2026-006)', code: 'AGROQR:v1:LFID-2026-006:11-23-04-001-000106:SIG5531F' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.codeTypePill, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                onPress={() => onQuickSelect(item.code)}
              >
                <Text style={{ color: '#15803D', fontSize: 12, fontWeight: '700' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.modalInputRow, { backgroundColor: inputBg, borderColor: border }]}>
            <View style={{ marginRight: 10 }}>
              <QrCode size={18} color={textMuted} />
            </View>
            <TextInput
              style={[styles.modalInput, { color: textPrimary }]}
              placeholder="e.g. LFID-2026-001"
              placeholderTextColor={textMuted}
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={onSubmit}
            />
            {value.length > 0 && (
              <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.modalSubmitBtn} onPress={onSubmit} activeOpacity={0.85}>
            <Text style={styles.modalSubmitText}>Verify & Look Up Farmer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, justifyContent: 'space-between' },
  menuBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  permDeniedTitle: { fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  permDeniedDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  grantBtn: { backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%', alignItems: 'center' },
  grantBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  manualBtnOutline: { borderRadius: 12, borderWidth: 1.5, paddingVertical: 13, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  manualBtnOutlineText: { fontSize: 15, fontWeight: '600' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, height: '20%', backgroundColor: 'rgba(0,0,0,0.6)' },
  scanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  scanHeaderBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  scanHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  viewfinderWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frameOuter: { width: 240, height: 240, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#FFFFFF' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#16A34A', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 },
  scanHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 20 },
  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', maxWidth: 380 },
  resultTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', marginTop: 10, marginBottom: 12, textAlign: 'center' },
  resultCodeBox: { backgroundColor: '#F0F7FF', borderRadius: 10, padding: 12, width: '100%', marginBottom: 14 },
  resultCode: { color: '#16A34A', fontSize: 14, fontWeight: '700', textAlign: 'center', fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }) },
  quickActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  quickActionText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  confirmBtn: { backgroundColor: '#0F172A', borderRadius: 14, paddingVertical: 13, width: '100%', alignItems: 'center', marginBottom: 8 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scanAgainBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  scanAgainText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  bottomControls: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, paddingVertical: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
  controlBtn: { alignItems: 'center', gap: 6 },
  controlLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },
  manualEntryBtn: { backgroundColor: 'rgba(22,163,74,0.35)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(22,163,74,0.6)' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  codeTypePill: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 54, marginBottom: 16 },
  modalInput: { flex: 1, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  modalSubmitBtn: { backgroundColor: '#16A34A', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
