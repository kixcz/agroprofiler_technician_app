import { Text } from '@/components/ui/text';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react-native';
import * as React from 'react';
import { Animated, View } from 'react-native';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  const animatedValue = React.useRef(new Animated.Value(isOnline ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline]);

  if (isOnline) return null;

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
      }}
      className="bg-red-500 px-4 py-2 absolute top-0 left-0 right-0 z-50"
    >
      <View className="flex-row items-center justify-center gap-2">
        <WifiOff size={18} color="#FFFFFF" />
        <Text className="text-white text-sm font-medium">
          You're offline. Changes will be saved locally.
        </Text>
        <AlertCircle size={18} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
}

// Online Status Indicator (for header/dashboard)
export function OnlineStatusIndicator({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${
        isOnline ? 'bg-green-100' : 'bg-red-100'
      }`}
    >
      {isOnline ? (
        <Wifi size={14} color="#10B981" />
      ) : (
        <WifiOff size={14} color="#EF4444" />
      )}
      <Text className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
}

// Sync Status Badge
export function SyncStatusBadge({ 
  isOnline, 
  pendingCount = 0,
  onPress 
}: { 
  isOnline: boolean; 
  pendingCount?: number;
  onPress?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {pendingCount > 0 && (
        <View className="bg-amber-500 px-2 py-0.5 rounded-full">
          <Text className="text-xs font-bold text-white">{pendingCount}</Text>
        </View>
      )}
      <Text className="text-xs text-muted-foreground">
        {isOnline ? 'Synced' : 'Offline'}
      </Text>
    </View>
  );
}
