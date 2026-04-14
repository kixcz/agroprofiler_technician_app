import { ClipboardList, Home, QrCode, User, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_HEIGHT = 60;
const FAB_SIZE = 56;
const FAB_LIFT = FAB_SIZE / 2 + 8; // How far FAB center sits above bar top

type IconFn = (color: string, focused: boolean) => React.ReactNode;

const TAB_META: Record<string, { label: string; icon: IconFn }> = {
  index: {
    label: 'Home',
    icon: (c, f) => <Home size={23} color={c} strokeWidth={f ? 2.5 : 1.8} />,
  },
  farmers: {
    label: 'Farmers',
    icon: (c, f) => <Users size={23} color={c} strokeWidth={f ? 2.5 : 1.8} />,
  },
  activities: {
    label: 'Activities',
    icon: (c, f) => <ClipboardList size={23} color={c} strokeWidth={f ? 2.5 : 1.8} />,
  },
  profile: {
    label: 'Profile',
    icon: (c, f) => <User size={23} color={c} strokeWidth={f ? 2.5 : 1.8} />,
  },
};

const LEFT_TABS = ['index', 'farmers'];
const RIGHT_TABS = ['activities', 'profile'];

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = isDark ? '#0F1F14' : '#FFFFFF';
  const border = isDark ? '#1F3A28' : '#E5E7EB';
  const activeColor = '#16A34A';
  const inactiveColor = '#6B7280';

  const activeName: string = state.routes[state.index]?.name ?? '';
  const isScanActive = activeName === 'scan';

  const handlePress = (routeName: string, routeKey: string) => {
    const isFocused = activeName === routeName;
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const scanRoute = state.routes.find((r: any) => r.name === 'scan');

  const renderTab = (routeName: string) => {
    const route = state.routes.find((r: any) => r.name === routeName);
    if (!route) return null;
    const isActive = activeName === routeName;
    const color = isActive ? activeColor : inactiveColor;
    const meta = TAB_META[routeName];
    if (!meta) return null;

    return (
      <TouchableOpacity
        key={route.key}
        style={styles.tabItem}
        onPress={() => handlePress(routeName, route.key)}
        activeOpacity={0.65}
        accessibilityRole="button"
        accessibilityLabel={meta.label}
      >
        {/* 2px active top indicator */}
        {isActive && (
          <View style={[styles.activeBar, { backgroundColor: activeColor }]} />
        )}
        <View style={styles.tabContent}>
          {meta.icon(color, isActive)}
          <Text
            style={[
              styles.tabLabel,
              { color, fontWeight: isActive ? '700' : '500' },
            ]}
            numberOfLines={1}
          >
            {meta.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const bottomPad =
    insets.bottom > 0
      ? insets.bottom
      : Platform.OS === 'android'
        ? 8
        : 0;

  return (
    /* Root — height = bar height + safe area, overflow visible for FAB */
    <View
      style={[
        styles.root,
        { height: TAB_HEIGHT + bottomPad, backgroundColor: bg, borderTopColor: border },
      ]}
    >
      {/* ── FAB (absolutely positioned, overflows above bar) ── */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: activeColor,
              shadowColor: isScanActive ? activeColor : '#000',
              shadowOpacity: isScanActive ? 0.45 : 0.28,
              elevation: isScanActive ? 14 : 10,
            },
          ]}
          onPress={() =>
            scanRoute && handlePress('scan', scanRoute.key)
          }
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Scan QR Code"
        >
          <QrCode size={26} color="#FFFFFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* ── Tab row ── */}
      <View
        style={[
          styles.row,
          { paddingBottom: bottomPad },
        ]}
      >
        {LEFT_TABS.map(renderTab)}

        {/* Centre placeholder — same flex as a real tab, no content */}
        <View style={styles.fabSlot} />

        {RIGHT_TABS.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderTopWidth: 1,
    overflow: 'visible', // allow FAB to float above
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },

  /* ── FAB ── */
  fabWrapper: {
    position: 'absolute',
    top: -(FAB_LIFT),       // lift above bar top
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },

  /* ── Tab row ── */
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    position: 'relative',
    paddingTop: 6,
  },

  activeBar: {
    position: 'absolute',
    top: 0,
    left: '18%',
    right: '18%',
    height: 2.5,
    borderRadius: 2,
  },

  tabContent: {
    alignItems: 'center',
    gap: 3,
  },

  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.15,
  },

  fabSlot: {
    flex: 1,           // same width as one tab
    minWidth: 44,
  },
});
