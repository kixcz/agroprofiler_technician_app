import { useSidebar } from '@/lib/SidebarContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Keyboard,
  Menu,
  QrCode,
  RefreshCw,
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function ScanScreen() {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(data);
    Vibration.vibrate(80);
  };

  const handleConfirm = () => {
    if (!scannedData) return;
    // Navigate to farmer profile with the scanned code
    router.push({ pathname: '/(dashboard)/farmer-profile', params: { code: scannedData } } as any);
    setScanned(false);
    setScannedData(null);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
  };

  const handleManualLookup = () => {
    if (!manualCode.trim()) {
      Alert.alert('Empty Code', 'Please enter an LFID, FID, or FPID code.');
      return;
    }
    setManualModalVisible(false);
    router.push({
      pathname: '/(dashboard)/farmer-profile',
      params: { code: manualCode.trim() },
    } as any);
    setManualCode('');
  };

  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const card = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';
  const bg = isDark ? '#0F172A' : '#0F172A';

  // ── Permission not determined yet ──
  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#FFFFFF' }}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  // ── Permission denied ──
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F0F7FF' }} edges={['top', 'left', 'right', 'bottom']}>
        {/* Header */}
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
              Please grant camera permission to scan QR codes. You can still enter codes manually.
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
          isDark={isDark}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Full-screen camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay (top) */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* ── Custom Header ── */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <View style={styles.scanHeader}>
          <TouchableOpacity onPress={openSidebar} style={styles.scanHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Menu size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.scanHeaderTitle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {/* ── Viewfinder frame ── */}
      <View style={styles.viewfinderWrapper} pointerEvents="none">
        <View style={styles.frameOuter}>
          {/* Corners */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {/* Scan line */}
          {!scanned && (
            <Animated.View
              style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
            />
          )}
        </View>
        <Text style={styles.scanHint}>
          {scanned ? '' : 'Align QR code within the frame'}
        </Text>
      </View>

      {/* ── Scan Result overlay ── */}
      {scanned && scannedData && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <CheckCircle size={40} color="#10B981" />
            <Text style={styles.resultTitle}>QR Code Detected</Text>
            <View style={styles.resultCodeBox}>
              <Text style={styles.resultCode} numberOfLines={2}>{scannedData}</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Confirm & Open Farmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain} activeOpacity={0.85}>
              <RefreshCw size={16} color="#64748B" />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Bottom controls ── */}
      {!scanned && (
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setTorchOn((v) => !v)}
              activeOpacity={0.8}
            >
              {torchOn ? (
                <Zap size={22} color="#F59E0B" />
              ) : (
                <ZapOff size={22} color="#FFFFFF" />
              )}
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
              <Text style={styles.controlLabel}>Enter Code</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* ── Manual Entry Modal ── */}
      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        value={manualCode}
        onChange={setManualCode}
        onSubmit={handleManualLookup}
        isDark={isDark}
      />
    </View>
  );
}

// ── Manual Entry Modal Component ──
function ManualEntryModal({
  visible,
  onClose,
  value,
  onChange,
  onSubmit,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
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
          {/* Handle */}
          <View style={[styles.modalHandle, { backgroundColor: border }]} />

          {/* Header row */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>Enter Code Manually</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalDesc, { color: textMuted }]}>
            Enter the farmer's LFID, FID, or FPID number to look up their record.
          </Text>

          {/* Code types hint */}
          <View style={styles.codeTypeRow}>
            {['LFID', 'FID', 'FPID'].map((t) => (
              <View key={t} style={[styles.codeTypePill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={{ color: '#16A34A', fontSize: 11, fontWeight: '700' }}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Input */}
          <View style={[styles.modalInputRow, { backgroundColor: inputBg, borderColor: border }]}>
            <View style={{ marginRight: 10 }}><QrCode size={18} color={textMuted} /></View>
            <TextInput
              style={[styles.modalInput, { color: textPrimary }]}
              placeholder="e.g. LFID-00123"
              placeholderTextColor={textMuted}
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={onSubmit}
              autoFocus
            />
            {value.length > 0 && (
              <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.modalSubmitBtn} onPress={onSubmit} activeOpacity={0.85}>
            <Text style={styles.modalSubmitText}>Look Up Farmer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Permission denied
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  permDeniedTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permDeniedDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  grantBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  manualBtnOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  manualBtnOutlineText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Camera overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  scanHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  viewfinderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameOuter: {
    width: 240,
    height: 240,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  scanHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 20,
  },
  // Result overlay
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 16,
  },
  resultCodeBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  resultCode: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  confirmBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  scanAgainText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bottom controls
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  controlBtn: {
    alignItems: 'center',
    gap: 6,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  manualEntryBtn: {
    backgroundColor: 'rgba(37,99,235,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.5)',
  },
  // Manual entry modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  codeTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  codeTypePill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    marginBottom: 16,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalSubmitBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
