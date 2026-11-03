import { GeotaggedCameraModal } from '@/components/evidence/GeotaggedCameraModal';
import { useSidebar } from '@/lib/SidebarContext';
import { FieldEvidenceRecord, saveFarmerOffline } from '@/lib/db/database';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import * as React from 'react';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

const BARANGAYS = [
  'Poblacion',
  'San Isidro',
  'Mabuhay',
  'Maligaya',
  'Bagong Silang',
  'Santa Cruz',
];
const COMMODITIES = ['Rice', 'Corn', 'Vegetables', 'Fruit Trees', 'Coconut', 'Other'];
const IRRIGATION_TYPES = [
  'National Irrigation System (NIS)',
  'Communal Irrigation System (CIS)',
  'Rain-fed',
  'Pump',
];

const SECTIONS = [
  {
    key: 'personal',
    label: 'Personal Information',
    icon: <User size={18} color="#16A34A" />,
    color: '#DCFCE7',
    border: '#BBF7D0',
  },
  {
    key: 'contact',
    label: 'Contact Information',
    icon: <Phone size={18} color="#0891B2" />,
    color: '#CFFAFE',
    border: '#A5F3FC',
  },
  {
    key: 'location',
    label: 'Location & Barangay',
    icon: <MapPin size={18} color="#F59E0B" />,
    color: '#FEF9C3',
    border: '#FDE68A',
  },
  {
    key: 'farm',
    label: 'Farm Information',
    icon: <Leaf size={18} color="#8B5CF6" />,
    color: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    key: 'ids',
    label: 'Government IDs & Vulnerability Flags',
    icon: <User size={18} color="#EF4444" />,
    color: '#FEF2F2',
    border: '#FECACA',
  },
  {
    key: 'evidence',
    label: 'Geotagged Field Verification Photo',
    icon: <Camera size={18} color="#16A34A" />,
    color: '#DCFCE7',
    border: '#BBF7D0',
  },
];

export default function RegisterFarmerScreen() {
  const { openSidebar } = useSidebar();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [birthDate, setBirthDate] = useState('1984-06-15');
  const [gender, setGender] = useState('Male');
  const [civilStatus, setCivilStatus] = useState('Married');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [purok, setPurok] = useState('');
  const [address, setAddress] = useState('');
  const [commodity, setCommodity] = useState('Rice');
  const [farmSize, setFarmSize] = useState('1.5');
  const [irrigationType, setIrrigationType] = useState('National Irrigation System (NIS)');
  const [landTenure, setLandTenure] = useState('Owner');
  const [lfid, setLfid] = useState('');
  const [rsbsaNumber, setRsbsaNumber] = useState('');
  const [is4Ps, setIs4Ps] = useState(false);
  const [isIp, setIsIp] = useState(false);
  const [isPwd, setIsPwd] = useState(false);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [capturedEvidence, setCapturedEvidence] = useState<FieldEvidenceRecord[]>([]);

  const bg = isDark ? '#071A0E' : '#F0FDF4';
  const card = isDark ? '#0F2418' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#E7F5ED';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#071A0E' : '#F8FFF9';
  const inputBorder = isDark ? '#1F3A28' : '#BBF7D0';
  const placeholder = '#94A3B8';

  const handleSubmit = async () => {
    if (!lastName.trim() || !firstName.trim()) {
      Alert.alert('Required', 'Last name and first name are required.');
      return;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('Required', 'Mobile number is required.');
      return;
    }
    if (!barangay) {
      Alert.alert('Required', 'Please select a barangay.');
      return;
    }
    if (!commodity) {
      Alert.alert('Required', 'Please select a commodity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const latestEv = capturedEvidence[capturedEvidence.length - 1];
      const saved = await saveFarmerOffline({
        lfid: lfid.trim() || undefined,
        rsbsa_number:
          rsbsaNumber.trim() ||
          `11-23-04-001-${Math.floor(100000 + Math.random() * 900000)}`,
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        suffix: suffix.trim(),
        sex: gender || 'Male',
        birthdate: birthDate.trim() || '1980-01-01',
        civil_status: civilStatus || 'Married',
        mobile_number: mobileNumber.trim(),
        email: email.trim(),
        barangay: barangay.replace(/^Barangay\s+/i, ''),
        purok: purok.trim() || 'Purok 1',
        address:
          address.trim() ||
          `${purok.trim() || 'Purok 1'}, Brgy. ${barangay.replace(/^Barangay\s+/i, '')}`,
        primary_commodity: commodity,
        farm_size: farmSize.trim() || '1.0',
        irrigation_type: irrigationType || 'Irrigated',
        land_tenure: landTenure || 'Owner',
        is_4ps: is4Ps,
        is_ip: isIp,
        is_pwd: isPwd,
        registration_status: 'pending_review',
        photo_uri: latestEv?.local_original_uri || null,
        evidenceIds: capturedEvidence.map((e) => e.evidence_id),
        latitude: latestEv?.latitude ?? null,
        longitude: latestEv?.longitude ?? null,
        accuracy: latestEv?.accuracy ?? null,
      });

      Alert.alert(
        'Saved to SQLite (Pending Sync)',
        `${saved.first_name} ${saved.last_name} (${saved.lfid}) has been registered locally with signed QR credential ${saved.qr_code} and queued for server synchronization.`,
        [
          {
            text: 'View Farmer Profile',
            onPress: () =>
              router.replace({
                pathname: '/(dashboard)/farmer-profile' as any,
                params: { id: saved.id, lfid: saved.lfid },
              }),
          },
          { text: 'Back to Farmers', onPress: () => router.push('/(dashboard)/farmers' as any) },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save farmer record offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Field = ({
    label,
    value,
    onChangeText,
    placeholder: ph,
    icon,
    multiline,
    ...props
  }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: textPrimary }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: inputBg, borderColor: inputBorder },
          multiline && { height: 80, alignItems: 'flex-start', paddingTop: 12 },
        ]}
      >
        {icon && <View style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}>{icon}</View>}
        <TextInput
          style={[
            styles.inputText,
            { color: textPrimary },
            multiline && { height: 60, textAlignVertical: 'top' },
          ]}
          placeholder={ph}
          placeholderTextColor={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          {...props}
        />
      </View>
    </View>
  );

  const Select = ({ label, value, onSelect, options, icon }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: textPrimary }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }]}
        onPress={() =>
          Alert.alert(
            label,
            'Select:',
            options.map((o: string) => ({ text: o, onPress: () => onSelect(o) }))
          )
        }
        activeOpacity={0.7}
      >
        {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
        <Text
          style={[
            styles.inputText,
            { color: value ? textPrimary : placeholder, flex: 1 },
          ]}
        >
          {value || 'Select an option'}
        </Text>
        <ChevronDown size={18} color={textMuted} />
      </TouchableOpacity>
    </View>
  );

  const SectionCard = ({ sec, children }: any) => (
    <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: sec.color, borderColor: sec.border },
        ]}
      >
        <View style={[styles.sectionIconBg, { backgroundColor: sec.border }]}>
          {sec.icon}
        </View>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{sec.label}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#16A34A' }]}>
        <TouchableOpacity
          onPress={openSidebar}
          style={styles.menuBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Register Farmer (Offline Ready)</Text>
          <Text style={styles.headerSub}>
            Saves to SQLite with signed QR & geotagged evidence
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        >
          {/* Personal Information */}
          <SectionCard sec={SECTIONS[0]}>
            <Field
              label="Last Name *"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              icon={<User size={18} color={textMuted} />}
            />
            <Field
              label="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              icon={<User size={18} color={textMuted} />}
            />
            <Field
              label="Middle Name"
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Optional"
              icon={<User size={18} color={textMuted} />}
            />
            <Field
              label="Suffix"
              value={suffix}
              onChangeText={setSuffix}
              placeholder="e.g. Jr., Sr., III"
            />
            <Field
              label="Date of Birth"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              icon={<Calendar size={18} color={textMuted} />}
            />
            <Select
              label="Gender"
              value={gender}
              onSelect={setGender}
              options={['Male', 'Female', 'Other']}
            />
            <Select
              label="Civil Status"
              value={civilStatus}
              onSelect={setCivilStatus}
              options={['Single', 'Married', 'Widowed', 'Separated']}
            />
          </SectionCard>

          {/* Contact Information */}
          <SectionCard sec={SECTIONS[1]}>
            <Field
              label="Mobile Number *"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="09XX XXX XXXX"
              icon={<Phone size={18} color={textMuted} />}
              keyboardType="phone-pad"
            />
            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="farmer@example.com"
              icon={<Mail size={18} color={textMuted} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </SectionCard>

          {/* Location */}
          <SectionCard sec={SECTIONS[2]}>
            <Select
              label="Barangay *"
              value={barangay}
              onSelect={setBarangay}
              options={BARANGAYS}
              icon={<MapPin size={18} color={textMuted} />}
            />
            <Field
              label="Purok / Sitio"
              value={purok}
              onChangeText={setPurok}
              placeholder="Enter purok or sitio"
            />
            <Field
              label="Complete Address"
              value={address}
              onChangeText={setAddress}
              placeholder="House no., street"
              multiline
            />
          </SectionCard>

          {/* Farm Information */}
          <SectionCard sec={SECTIONS[3]}>
            <Select
              label="Primary Commodity *"
              value={commodity}
              onSelect={setCommodity}
              options={COMMODITIES}
              icon={<Leaf size={18} color={textMuted} />}
            />
            <Field
              label="Farm Size (hectares)"
              value={farmSize}
              onChangeText={setFarmSize}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />
            <Select
              label="Irrigation Type"
              value={irrigationType}
              onSelect={setIrrigationType}
              options={IRRIGATION_TYPES}
            />
            <Select
              label="Land Tenure"
              value={landTenure}
              onSelect={setLandTenure}
              options={['Owner', 'Lessee', 'Tenancy', 'Others']}
            />
          </SectionCard>

          {/* Government IDs & Vulnerability Flags */}
          <SectionCard sec={SECTIONS[4]}>
            <Field
              label="LFID (Auto-generated if blank)"
              value={lfid}
              onChangeText={setLfid}
              placeholder="e.g. LFID-2026-109"
            />
            <Field
              label="RSBSA Number"
              value={rsbsaNumber}
              onChangeText={setRsbsaNumber}
              placeholder="e.g. 11-23-04-001-000109"
            />
            <Text style={[styles.fieldLabel, { color: textPrimary, marginTop: 4 }]}>
              Beneficiary Priority Classifications
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: '4Ps Beneficiary', active: is4Ps, toggle: () => setIs4Ps(!is4Ps) },
                { label: 'Indigenous (IP)', active: isIp, toggle: () => setIsIp(!isIp) },
                { label: 'PWD', active: isPwd, toggle: () => setIsPwd(!isPwd) },
              ].map((flag) => (
                <TouchableOpacity
                  key={flag.label}
                  onPress={flag.toggle}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: flag.active ? '#16A34A' : inputBorder,
                    backgroundColor: flag.active ? '#DCFCE7' : inputBg,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: flag.active ? '#15803D' : textMuted,
                    }}
                  >
                    {flag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          {/* Geotagged Field Verification Photo */}
          <SectionCard sec={SECTIONS[5]}>
            <Text style={{ fontSize: 12, color: textMuted, lineHeight: 18 }}>
              Capture an official geotagged in-app photograph of the farmer or their government ID.
              Gallery uploads are disabled to guarantee verified GPS coordinates and SHA-256 hash integrity.
            </Text>

            <TouchableOpacity
              onPress={() => setShowCameraModal(true)}
              style={{
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: '#16A34A',
                backgroundColor: '#F0FDF4',
                borderRadius: 14,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <Camera size={20} color="#16A34A" />
              <Text style={{ color: '#15803D', fontWeight: '700', fontSize: 14 }}>
                Capture Official Geotagged Photo
              </Text>
            </TouchableOpacity>

            {capturedEvidence.map((ev) => (
              <View
                key={ev.evidence_id}
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  padding: 10,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#071A0E' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={{ uri: ev.local_original_uri }}
                  style={{ width: 54, height: 54, borderRadius: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={13} color="#16A34A" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                      {ev.evidence_id}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: textPrimary, marginTop: 2 }}>
                    {ev.latitude
                      ? `GPS: ${ev.latitude.toFixed(5)}, ${ev.longitude?.toFixed(5)} (±${ev.accuracy}m)`
                      : `GPS Exception: ${ev.gps_exception_reason}`}
                  </Text>
                  <Text style={{ fontSize: 10, color: textMuted, marginTop: 1 }}>
                    Brgy. {ev.detected_barangay} • SHA-256: {ev.file_hash_sha256.slice(0, 14)}...
                  </Text>
                </View>
                <CheckCircle2 size={18} color="#16A34A" />
              </View>
            ))}
          </SectionCard>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {isSubmitting ? 'Saving to SQLite...' : 'Register Farmer (Save Offline & Queue Sync)'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.requiredNote, { color: textMuted }]}>* Required fields</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <GeotaggedCameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onEvidenceCaptured={(ev) => setCapturedEvidence((prev) => [...prev, ev])}
        activityType="farmer_registration"
        activityLabel={`Farmer Registration: ${firstName || 'New'} ${lastName || 'Farmer'}`}
        farmerName={`${firstName} ${lastName}`.trim()}
        farmerLfid={lfid}
        expectedBarangay={barangay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 1,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionBody: {
    padding: 16,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    marginTop: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  requiredNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
});
