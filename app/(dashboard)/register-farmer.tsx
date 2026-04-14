import { useSidebar } from '@/lib/SidebarContext';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronDown,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Phone,
  Save,
  User,
} from 'lucide-react-native';
import * as React from 'react';
import { useState } from 'react';
import {
  Alert,
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

const BARANGAYS = ['Barangay San Isidro', 'Barangay Maligaya', 'Barangay Bagong Silang', 'Barangay Masagana', 'Barangay Matatag'];
const COMMODITIES = ['Rice', 'Corn', 'Vegetables', 'Fruit Trees', 'Coconut', 'Other'];
const IRRIGATION_TYPES = ['National Irrigation System (NIS)', 'Communal Irrigation System (CIS)', 'Rain-fed', 'Pump'];

const SECTIONS = [
  { key: 'personal', label: 'Personal Information', icon: <User size={18} color="#16A34A" />, color: '#DCFCE7', border: '#BBF7D0' },
  { key: 'contact', label: 'Contact Information', icon: <Phone size={18} color="#0891B2" />, color: '#CFFAFE', border: '#A5F3FC' },
  { key: 'location', label: 'Location', icon: <MapPin size={18} color="#F59E0B" />, color: '#FEF9C3', border: '#FDE68A' },
  { key: 'farm', label: 'Farm Information', icon: <Leaf size={18} color="#8B5CF6" />, color: '#F5F3FF', border: '#DDD6FE' },
  { key: 'ids', label: 'Government IDs', icon: <User size={18} color="#EF4444" />, color: '#FEF2F2', border: '#FECACA' },
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
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [barangay, setBarangay] = useState('');
  const [purok, setPurok] = useState('');
  const [address, setAddress] = useState('');
  const [commodity, setCommodity] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [irrigationType, setIrrigationType] = useState('');
  const [landTenure, setLandTenure] = useState('');
  const [lfid, setLfid] = useState('');
  const [rsbsaNumber, setRsbsaNumber] = useState('');

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
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Registered!', 'Farmer has been registered successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 1500);
  };

  const Field = ({ label, value, onChangeText, placeholder: ph, icon, multiline, ...props }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: textPrimary }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: inputBorder }, multiline && { height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
        {icon && <View style={{ marginRight: 10, marginTop: multiline ? 2 : 0 }}>{icon}</View>}
        <TextInput
          style={[styles.inputText, { color: textPrimary }, multiline && { height: 60, textAlignVertical: 'top' }]}
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
          Alert.alert(label, 'Select:', options.map((o: string) => ({ text: o, onPress: () => onSelect(o) })))
        }
        activeOpacity={0.7}
      >
        {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
        <Text style={[styles.inputText, { color: value ? textPrimary : placeholder, flex: 1 }]}>
          {value || 'Select an option'}
        </Text>
        <ChevronDown size={18} color={textMuted} />
      </TouchableOpacity>
    </View>
  );

  const SectionCard = ({ sec, children }: any) => (
    <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>
      <View style={[styles.sectionHeader, { backgroundColor: sec.color, borderColor: sec.border }]}>
        <View style={[styles.sectionIconBg, { backgroundColor: sec.border }]}>{sec.icon}</View>
        <Text style={[styles.sectionTitle, { color: textPrimary }]}>{sec.label}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#16A34A' }]}>
        <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Menu size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Register Farmer</Text>
          <Text style={styles.headerSub}>Fill in the farmer's details</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>

          {/* Personal Information */}
          <SectionCard sec={SECTIONS[0]}>
            <Field label="Last Name *" value={lastName} onChangeText={setLastName} placeholder="Enter last name" icon={<User size={18} color={textMuted} />} />
            <Field label="First Name *" value={firstName} onChangeText={setFirstName} placeholder="Enter first name" icon={<User size={18} color={textMuted} />} />
            <Field label="Middle Name" value={middleName} onChangeText={setMiddleName} placeholder="Optional" icon={<User size={18} color={textMuted} />} />
            <Field label="Suffix" value={suffix} onChangeText={setSuffix} placeholder="e.g. Jr., Sr., III" />
            <Field label="Date of Birth" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" icon={<Calendar size={18} color={textMuted} />} />
            <Select label="Gender" value={gender} onSelect={setGender} options={['Male', 'Female', 'Other']} />
            <Select label="Civil Status" value={civilStatus} onSelect={setCivilStatus} options={['Single', 'Married', 'Widowed', 'Separated']} />
          </SectionCard>

          {/* Contact Information */}
          <SectionCard sec={SECTIONS[1]}>
            <Field label="Mobile Number *" value={mobileNumber} onChangeText={setMobileNumber} placeholder="09XX XXX XXXX" icon={<Phone size={18} color={textMuted} />} keyboardType="phone-pad" />
            <Field label="Email Address" value={email} onChangeText={setEmail} placeholder="farmer@example.com" icon={<Mail size={18} color={textMuted} />} keyboardType="email-address" autoCapitalize="none" />
          </SectionCard>

          {/* Location */}
          <SectionCard sec={SECTIONS[2]}>
            <Select label="Barangay *" value={barangay} onSelect={setBarangay} options={BARANGAYS} icon={<MapPin size={18} color={textMuted} />} />
            <Field label="Purok / Sitio" value={purok} onChangeText={setPurok} placeholder="Enter purok or sitio" />
            <Field label="Complete Address" value={address} onChangeText={setAddress} placeholder="House no., street" multiline />
          </SectionCard>

          {/* Farm Information */}
          <SectionCard sec={SECTIONS[3]}>
            <Select label="Primary Commodity *" value={commodity} onSelect={setCommodity} options={COMMODITIES} icon={<Leaf size={18} color={textMuted} />} />
            <Field label="Farm Size (hectares)" value={farmSize} onChangeText={setFarmSize} placeholder="e.g. 2.5" keyboardType="decimal-pad" />
            <Select label="Irrigation Type" value={irrigationType} onSelect={setIrrigationType} options={IRRIGATION_TYPES} />
            <Select label="Land Tenure" value={landTenure} onSelect={setLandTenure} options={['Owner', 'Lessee', 'Tenancy', 'Others']} />
          </SectionCard>

          {/* Government IDs */}
          <SectionCard sec={SECTIONS[4]}>
            <Field label="LFID (Local Farmer ID)" value={lfid} onChangeText={setLfid} placeholder="Enter LFID" />
            <Field label="RSBSA Number" value={rsbsaNumber} onChangeText={setRsbsaNumber} placeholder="Enter RSBSA number" />
          </SectionCard>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Register Farmer'}</Text>
          </TouchableOpacity>
          <Text style={[styles.requiredNote, { color: textMuted }]}>* Required fields</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    fontSize: 16,
    fontWeight: '700',
  },
  requiredNote: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },
});
