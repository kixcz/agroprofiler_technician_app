import { Text } from '@/components/ui/text';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import * as React from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { useSyncEngine } from '@/lib/services/syncEngine';

interface OfflineBannerProps {
  isOnline?: boolean;
}

export function OfflineBanner({ isOnline: propOnline }: OfflineBannerProps) {
  const {
    indicator,
    isConnected,
    pendingCount,
    failedCount,
    conflictCount,
    syncNow,
  } = useSyncEngine();

  const effectiveOnline = propOnline !== undefined ? propOnline : isConnected;
  const showBanner =
    !effectiveOnline ||
    indicator === 'pending_sync' ||
    indicator === 'syncing' || 
    indicator === 'sync_failed';

  const animatedValue = React.useRef(new Animated.Value(showBanner ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: showBanner ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showBanner]);

  if (!showBanner) return null;

  const getBannerConfig = () => {
    if (!effectiveOnline) {
      return {
        bg: '#DC2626',
        icon: <WifiOff size={15} color="#FFFFFF" />,
        text:
          pendingCount > 0
            ? `Offline Mode • ${pendingCount} transaction(s) saved in SQLite`
            : 'Offline Mode • Field operations active via local SQLite',
        actionLabel: null,
      };
    }
    if (indicator === 'syncing') {
      return {
        bg: '#2563EB',
        icon: <RefreshCw size={15} color="#FFFFFF" />,
        text: `Syncing ${pendingCount} pending field record(s) & SHA-256 media...`,
        actionLabel: null,
      };
    }
    if (indicator === 'sync_failed') {
      return {
        bg: '#B45309',
        icon: <AlertTriangle size={15} color="#FFFFFF" />,
        text:
          conflictCount > 0
            ? `Sync Conflict (${conflictCount}) • Review required before overwrite`
            : `Sync Failed (${failedCount}) • Retrying with exponential backoff`,
        actionLabel: 'Retry Now',
      };
    }
    return {
      bg: '#D97706',
      icon: <Clock size={15} color="#FFFFFF" />,
      text: `Pending Sync (${pendingCount} local transaction${pendingCount === 1 ? '' : 's'})`,
      actionLabel: 'Sync Now',
    };
  };

  const cfg = getBannerConfig();

  return (
    <Animated.View
      style={{
        backgroundColor: cfg.bg,
        paddingHorizontal: 14,
        paddingVertical: 7,
        zIndex: 50,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }}>
          {cfg.icon}
          <Text
            style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', flex: 1 }}
            numberOfLines={1}
          >
            {cfg.text}
          </Text>
        </View>
        {cfg.actionLabel && (
          <TouchableOpacity
            onPress={() => syncNow()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.22)',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 99,
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
              {cfg.actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// Unified Status Indicator Pill (supports Online, Offline, Pending Sync, Syncing, Synced, Sync Failed)
export function OnlineStatusIndicator({ isOnline }: { isOnline?: boolean }) {
  const { indicator, isConnected, pendingCount, syncNow } = useSyncEngine();
  const effectiveOnline = isOnline !== undefined ? isOnline : isConnected;

  const getBadgeMeta = () => {
    if (!effectiveOnline) {
      return {
        bg: '#FEE2E2',
        color: '#B91C1C',
        label: pendingCount > 0 ? `Offline (${pendingCount} Pending)` : 'Offline',
        icon: <WifiOff size={13} color="#B91C1C" />,
      };
    }
    if (indicator === 'syncing') {
      return {
        bg: '#DBEAFE',
        color: '#1D4ED8',
        label: 'Syncing...',
        icon: <RefreshCw size={13} color="#1D4ED8" />,
      };
    }
    if (indicator === 'sync_failed') {
      return {
        bg: '#FEF3C7',
        color: '#B45309',
        label: 'Sync Failed',
        icon: <AlertCircle size={13} color="#B45309" />,
      };
    }
    if (pendingCount > 0 || indicator === 'pending_sync') {
      return {
        bg: '#FEF3C7',
        color: '#D97706',
        label: `Pending Sync (${pendingCount})`,
        icon: <Clock size={13} color="#D97706" />,
      };
    }
    if (indicator === 'synced') {
      return {
        bg: '#DCFCE7',
        color: '#15803D',
        label: 'Synced',
        icon: <CheckCircle2 size={13} color="#15803D" />,
      };
    }
    return {
      bg: '#DCFCE7',
      color: '#15803D',
      label: 'Online',
      icon: <Wifi size={13} color="#15803D" />,
    };
  };

  const meta = getBadgeMeta();

  return (
    <TouchableOpacity
      onPress={() => syncNow()}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 99,
        backgroundColor: meta.bg,
      }}
    >
      {meta.icon}
      <Text style={{ fontSize: 11, fontWeight: '700', color: meta.color }}>
        {meta.label}
      </Text>
    </TouchableOpacity>
  );
}

// Sync Status Badge
export function SyncStatusBadge({
  isOnline,
  pendingCount: propPending,
  onPress,
}: {
  isOnline?: boolean;
  pendingCount?: number;
  onPress?: () => void;
}) {
  const { isConnected, pendingCount: enginePending, indicator, syncNow } = useSyncEngine();
  const effectiveOnline = isOnline !== undefined ? isOnline : isConnected;
  const count = propPending !== undefined ? propPending : enginePending;

  return (
    <TouchableOpacity
      onPress={onPress || (() => syncNow())}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: !effectiveOnline
            ? '#EF4444'
            : indicator === 'sync_failed'
            ? '#F59E0B'
            : count > 0
            ? '#F59E0B'
            : '#10B981',
        }}
      />
      {count > 0 && (
        <View
          style={{
            backgroundColor: '#F59E0B',
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 99,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{count}</Text>
        </View>
      )}
      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
        {!effectiveOnline
          ? 'Offline'
          : indicator === 'syncing'
          ? 'Syncing'
          : indicator === 'sync_failed'
          ? 'Sync Failed'
          : count > 0
          ? 'Pending Sync'
          : 'Synced'}
      </Text>
    </TouchableOpacity>
  );
}
