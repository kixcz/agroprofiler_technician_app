import CustomTabBar from '@/components/ui/CustomTabBar';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import Sidebar from '@/components/ui/Sidebar';
import { SidebarProvider } from '@/lib/SidebarContext';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          {/* ── BOTTOM NAV: 5 items (L→R: Home, Farmers, Scan-FAB, Activities, Profile) ── */}
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="farmers" options={{ title: 'Farmers' }} />
          <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
          <Tabs.Screen name="activities" options={{ title: 'Activities' }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

          {/* ── SIDEBAR-ACCESSIBLE (hidden from tab bar) ── */}
          <Tabs.Screen name="register-farmer" options={{ tabBarButton: () => null }} />
          <Tabs.Screen name="record-damage" options={{ tabBarButton: () => null }} />
          <Tabs.Screen name="distribute" options={{ tabBarButton: () => null }} />
          <Tabs.Screen name="crop-monitoring" options={{ tabBarButton: () => null }} />

          {/* ── PUSH-ONLY SCREENS ── */}
          <Tabs.Screen name="farmer-profile" options={{ tabBarButton: () => null }} />
          <Tabs.Screen name="add-farm" options={{ tabBarButton: () => null }} />
          <Tabs.Screen name="farm-details" options={{ tabBarButton: () => null }} />
        </Tabs>

        {/* Global retractable sidebar overlay */}
        <Sidebar />
      </View>
    </SidebarProvider>
  );
}
