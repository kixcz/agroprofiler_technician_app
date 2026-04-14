import { View } from 'react-native';
import * as React from 'react';
import { Animated } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  className = '' 
}: SkeletonProps) {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#E5E7EB',
      }}
      className={className}
    >
      <Animated.View
        style={{
          opacity,
          flex: 1,
        }}
      />
    </View>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <View className="bg-white border border-border rounded-lg p-4 mb-3">
      <Skeleton width="70%" height={18} className="mb-2" />
      <Skeleton width="90%" height={14} className="mb-2" />
      <Skeleton width="60%" height={14} />
    </View>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <View className="flex-row items-center gap-3 bg-white border border-border rounded-lg p-4 mb-3">
      <Skeleton width={48} height={48} borderRadius={24} />
      <View className="flex-1">
        <Skeleton width="60%" height={16} className="mb-2" />
        <Skeleton width="80%" height={12} className="mb-2" />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

// Metrics Grid Skeleton
export function MetricsSkeleton() {
  return (
    <View className="flex-row flex-wrap -mx-2 mb-4">
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="w-1/2 px-2 mb-4">
          <View className="bg-white border border-border rounded-lg p-4">
            <Skeleton width={32} height={32} borderRadius={8} className="mb-2" />
            <Skeleton width="50%" height={24} className="mb-1" />
            <Skeleton width="70%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Full Page Loading Skeleton
export function PageSkeleton() {
  return (
    <View className="flex-1 bg-background p-4">
      <Skeleton width="60%" height={28} className="mb-4" />
      <MetricsSkeleton />
      <Skeleton width="40%" height={20} className="mb-3 mt-4" />
      <CardSkeleton />
      <CardSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </View>
  );
}
