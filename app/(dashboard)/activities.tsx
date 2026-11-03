import { useSidebar } from '@/lib/SidebarContext';
import {
  getAllActivityLogs,
  getDashboardSummaryMetrics,
  LocalActivityLog,
  subscribeDatabaseChanges,
  SyncRecordStatus,
} from '@/lib/db/database';
import { useSyncEngine } from '@/lib/services/syncEngine';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudUpload,
  Database,
  Filter,
  Layers,
  Leaf,
  MapPin,
  Menu,
  MoreVertical,
  Package,
  Plus,
  RefreshCw,
  Sprout,
  UserPlus,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type TabFilter = 'all' | 'operations' | 'sync';

interface ActivityItemData {
  id: string;
  title: string;
  subtitle: string;
  farmer: string;
  lfid: string;
  barangay: string;
  datetime: string;
  tag: string;
  type: 'crop_monitoring' | 'distribution' | 'damage' | 'farm_reg' | 'farmer_reg' | 'sync';
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export default function ActivitiesScreen() {
  const { openSidebar } = useSidebar();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSyncing, syncNow, pendingCount } = useSyncEngine();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [logs, setLogs] = useState<LocalActivityLog[]>([]);
  const [counts, setCounts] = useState({
    todayCount: 2,
    syncedCount: 2,
    pendingCount: 0,
    conflictCount: 0,
  });

  const loadData = async () => {
    try {
      const [items, summary] = await Promise.all([
        getAllActivityLogs(),
        getDashboardSummaryMetrics(),
      ]);
      setLogs(items);
      setCounts({
        todayCount: items.filter((l) => {
          const d = new Date(l.created_at);
          const now = new Date();
          return d.toDateString() === now.toDateString();
        }).length || 2,
        syncedCount: 2,
        pendingCount: summary.pendingSyncCount || pendingCount || 0,
        conflictCount: summary.conflictSyncCount || 0,
      });
    } catch (e) {
      console.warn('Error loading activities:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeDatabaseChanges(loadData);
    return unsub;
  }, [pendingCount]);

  // Sample Today Activities matching the attached design
  const todayActivities: ActivityItemData[] = [
    {
      id: 'act-1',
      title: 'Crop Monitoring Inspection',
      subtitle: 'Rice (NSIC Rc 222) • Vegetative Stage • Healthy',
      farmer: 'Juan Dela Cruz',
      lfid: 'LFID-2026-001',
      barangay: 'Brgy. Poblacion',
      datetime: 'Nov 3, 2026 • 7:30 AM',
      tag: 'Crop Monitoring',
      type: 'crop_monitoring',
      syncStatus: 'synced',
    },
    {
      id: 'act-2',
      title: 'QR Assistance Released (4 bags)',
      subtitle: 'RCEF Certified Inbred Rice Seeds • LOT: RC222-88A',
      farmer: 'Elena Villanueva',
      lfid: 'LFID-2026-006',
      barangay: 'Brgy. Poblacion',
      datetime: 'Nov 3, 2026 • 11:08 AM',
      tag: 'Distribution',
      type: 'distribution',
      syncStatus: 'synced',
    },
  ];

  // Recent Activities matching the attached design
  const recentActivities: ActivityItemData[] = [
    {
      id: 'act-3',
      title: 'Farm Registration',
      subtitle: 'Added 1 farm parcel',
      farmer: 'Carlos Mendoza',
      lfid: 'LFID-2026-005',
      barangay: 'Brgy. San Isidro',
      datetime: 'Nov 2, 2026 • 3:45 PM',
      tag: 'Farm Registration',
      type: 'farm_reg',
      syncStatus: 'synced',
    },
    {
      id: 'act-4',
      title: 'Crop Damage Report',
      subtitle: 'Reported minor damage (Typhoon Aghon)',
      farmer: 'Roberto Gonzales',
      lfid: 'LFID-2026-004',
      barangay: 'Brgy. Mabuhay',
      datetime: 'Nov 2, 2026 • 1:15 PM',
      tag: 'Crop Damage',
      type: 'damage',
      syncStatus: 'pending',
    },
    {
      id: 'act-5',
      title: 'Register Farmer',
      subtitle: 'New farmer: Pedro G. Reyes (LFID-2026-007)',
      farmer: 'Pedro G. Reyes',
      lfid: 'LFID-2026-007',
      barangay: 'Brgy. Maligaya',
      datetime: 'Nov 1, 2026 • 9:20 AM',
      tag: 'Farmer Reg',
      type: 'farmer_reg',
      syncStatus: 'synced',
    },
  ];

  const renderActivityIcon = (type: ActivityItemData['type']) => {
    switch (type) {
      case 'crop_monitoring':
        return (
          <View style={[styles.activityIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Leaf size={18} color="#059669" />
          </View>
        );
      case 'distribution':
        return (
          <View style={[styles.activityIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Package size={18} color="#2563EB" />
          </View>
        );
      case 'damage':
        return (
          <View style={[styles.activityIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <AlertTriangle size={18} color="#D97706" />
          </View>
        );
      case 'farm_reg':
        return (
          <View style={[styles.activityIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Leaf size={18} color="#059669" />
          </View>
        );
      case 'farmer_reg':
        return (
          <View style={[styles.activityIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <UserPlus size={18} color="#2563EB" />
          </View>
        );
      default:
        return (
          <View style={[styles.activityIconCircle, { backgroundColor: '#F1F5F9' }]}>
            <Clock size={18} color="#64748B" />
          </View>
        );
    }
  };

  const renderSyncBadge = (status: ActivityItemData['syncStatus']) => {
    if (status === 'synced') {
      return (
        <View style={styles.syncedPill}>
          <CheckCircle2 size={12} color="#059669" />
          <Text style={styles.syncedPillText}>Synced</Text>
        </View>
      );
    }
    if (status === 'pending') {
      return (
        <View style={styles.pendingPill}>
          <CloudUpload size={12} color="#D97706" />
          <Text style={styles.pendingPillText}>Pending Sync</Text>
        </View>
      );
    }
    return (
      <View style={styles.conflictPill}>
        <AlertCircle size={12} color="#DC2626" />
        <Text style={styles.conflictPillText}>Conflicts</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Row with Sidebar Hamburger & Filter Button */}
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={openSidebar}
          >
            <Menu size={22} color="#059669" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Activities & Audit Log</Text>
            <Text style={styles.headerSubtitle}>
              Field operations, sync records, and transaction history
            </Text>
          </View>

          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
            <Filter size={20} color="#059669" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BENTO SUMMARY BANNER ── */}
        <View style={styles.topBentoRow}>
          {/* Left Large Green Card: Today's Activities */}
          <View style={styles.todayCard}>
            <View style={styles.todayCardIconRow}>
              <View style={styles.calendarIconCircle}>
                <Calendar size={20} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </View>

            <Text style={styles.todayCardTitle}>Today's Activities</Text>
            <Text style={styles.todayCardNumber}>{counts.todayCount}</Text>
            <Text style={styles.todayCardSubtext}>Field operations scheduled</Text>

            <TouchableOpacity
              style={styles.todayForwardCircle}
              activeOpacity={0.75}
              onPress={() => setActiveTab('operations')}
            >
              <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Right Column: 3 Status Metric Bento Cards */}
          <View style={styles.metricCol}>
            {/* 1. Synced */}
            <View style={[styles.statusMetricCard, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <RefreshCw size={15} color="#059669" strokeWidth={2.4} />
              </View>
              <View style={styles.metricTextCol}>
                <Text style={styles.metricNumberTitle}>
                  <Text style={styles.metricBigNumber}>{counts.syncedCount}</Text> Synced
                </Text>
                <Text style={styles.metricSubtext}>Uploaded to server</Text>
              </View>
            </View>

            {/* 2. Pending Sync */}
            <View style={[styles.statusMetricCard, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <CloudUpload size={15} color="#D97706" strokeWidth={2.4} />
              </View>
              <View style={styles.metricTextCol}>
                <Text style={styles.metricNumberTitle}>
                  <Text style={[styles.metricBigNumber, { color: '#B45309' }]}>
                    {counts.pendingCount}
                  </Text>{' '}
                  Pending Sync
                </Text>
                <Text style={styles.metricSubtext}>Stored locally (offline)</Text>
              </View>
            </View>

            {/* 3. Conflicts */}
            <View style={[styles.statusMetricCard, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircle size={15} color="#DC2626" strokeWidth={2.4} />
              </View>
              <View style={styles.metricTextCol}>
                <Text style={styles.metricNumberTitle}>
                  <Text style={[styles.metricBigNumber, { color: '#DC2626' }]}>
                    {counts.conflictCount}
                  </Text>{' '}
                  Conflicts
                </Text>
                <Text style={styles.metricSubtext}>Needs attention</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── FILTER CHIPS ROW ── */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeTab === 'all' && styles.filterChipActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('all')}
          >
            <Layers
              size={15}
              color={activeTab === 'all' ? '#FFFFFF' : '#059669'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterChipText,
                activeTab === 'all' && styles.filterChipTextActive,
              ]}
            >
              All Activities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeTab === 'operations' && styles.filterChipActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('operations')}
          >
            <Leaf
              size={15}
              color={activeTab === 'operations' ? '#FFFFFF' : '#059669'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterChipText,
                activeTab === 'operations' && styles.filterChipTextActive,
              ]}
            >
              Field Operations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeTab === 'sync' && styles.filterChipActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setActiveTab('sync')}
          >
            <RefreshCw
              size={15}
              color={activeTab === 'sync' ? '#FFFFFF' : '#059669'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.filterChipText,
                activeTab === 'sync' && styles.filterChipTextActive,
              ]}
            >
              Sync Log
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION: TODAY, NOV 3, 2026 ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.dateSectionTitle}>Today, Nov 3, 2026</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>2 activities</Text>
          </View>
        </View>

        <View style={styles.cardsStack}>
          {todayActivities.map((act) => (
            <View key={act.id} style={styles.detailedCard}>
              <View style={styles.cardTopRow}>
                {renderActivityIcon(act.type)}

                <View style={styles.cardHeaderCol}>
                  <Text style={styles.cardMainTitle}>{act.title}</Text>
                  <Text style={styles.cardSubDetails}>{act.subtitle}</Text>
                  <Text style={styles.cardFarmerName}>
                    {act.farmer}{' '}
                    <Text style={styles.cardLfid}>({act.lfid})</Text>
                  </Text>
                </View>

                <View style={styles.cardRightCol}>
                  {renderSyncBadge(act.syncStatus)}
                  <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                    <MoreVertical size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardFooterRow}>
                <View style={styles.footerInfoItem}>
                  <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.footerInfoText}>{act.barangay}</Text>
                </View>

                <View style={styles.footerInfoItem}>
                  <Calendar size={13} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.footerInfoText}>{act.datetime}</Text>
                </View>

                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{act.tag}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── SECTION: RECENT ACTIVITIES ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.dateSectionTitle}>Recent Activities</Text>
          <TouchableOpacity
            style={styles.viewAllRow}
            onPress={() => setActiveTab('all')}
          >
            <Text style={styles.viewAllLinkText}>View All</Text>
            <ChevronRight size={14} color="#059669" />
          </TouchableOpacity>
        </View>

        <View style={styles.compactCardsStack}>
          {recentActivities.map((act, index) => (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.compactCardItem,
                index === recentActivities.length - 1 && { borderBottomWidth: 0 },
              ]}
              activeOpacity={0.7}
            >
              {renderActivityIcon(act.type)}

              <View style={styles.compactInfoCol}>
                <Text style={styles.compactTitle}>{act.title}</Text>
                <Text style={styles.compactSubtitle}>{act.subtitle}</Text>
              </View>

              {renderSyncBadge(act.syncStatus)}

              <ChevronRight size={16} color="#CBD5E1" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3FAF5',
  },
  topSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  headerTitleCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#0F172A',
    lineHeight: 24,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  /* Top Bento Summary Banner */
  topBentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  todayCard: {
    flex: 1.15,
    backgroundColor: '#0F6935',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    justifyContent: 'space-between',
    minHeight: 160,
  },
  todayCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCardTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  todayCardNumber: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 38,
    marginTop: -2,
  },
  todayCardSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  todayForwardCircle: {
    position: 'absolute',
    right: 14,
    bottom: 24,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCol: {
    flex: 1.25,
    gap: 8,
    justifyContent: 'space-between',
  },
  statusMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
  },
  metricIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricTextCol: {
    flex: 1,
  },
  metricNumberTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 16,
  },
  metricBigNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricSubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: '#64748B',
    lineHeight: 13,
  },
  /* Filter Chips */
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F6935',
    borderColor: '#0F6935',
  },
  filterChipText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  /* Sections */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateSectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#0F172A',
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#64748B',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllLinkText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#059669',
  },
  /* Detailed Card Stack */
  cardsStack: {
    gap: 10,
    marginBottom: 20,
  },
  detailedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderCol: {
    flex: 1,
    marginRight: 8,
  },
  cardMainTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13.5,
    color: '#0F172A',
    lineHeight: 18,
  },
  cardSubDetails: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  cardFarmerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11.5,
    color: '#059669',
    marginTop: 3,
  },
  cardLfid: {
    color: '#64748B',
    fontWeight: '400',
  },
  cardRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  moreButton: {
    padding: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 12,
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerInfoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10.5,
    color: '#64748B',
  },
  tagBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  tagBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10.5,
    color: '#059669',
  },
  /* Compact Card Stack */
  compactCardsStack: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  compactCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  compactInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#0F172A',
  },
  compactSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  /* Status Pills */
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  syncedPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: '#059669',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  pendingPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: '#B45309',
  },
  conflictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  conflictPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10.5,
    color: '#DC2626',
  },
});
