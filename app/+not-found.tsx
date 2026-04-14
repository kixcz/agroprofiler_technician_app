import { Link, Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#111827' : '#F9FAFB';
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const mutedColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: bgColor }}>
      <Stack.Screen options={{ title: 'Page Not Found', headerShown: false }} />
      
      <View className="flex-1 justify-center items-center px-6">
        {/* Error Icon */}
        <View className="mb-6">
          <AlertCircle size={80} color="#EF4444" />
        </View>

        {/* Error Message */}
        <Text className="text-3xl font-bold text-center mb-3" style={{ color: textColor }}>
          Oops!
        </Text>
        
        <Text className="text-base text-center mb-2" style={{ color: mutedColor }}>
          This screen doesn't exist.
        </Text>
        
        <Text className="text-sm text-center mb-8" style={{ color: mutedColor }}>
          The page you're looking for might have been removed or is unavailable.
        </Text>

        {/* Action Buttons */}
        <View className="w-full gap-3">
          <Button
            onPress={() => router.push('/')}
            className="w-full"
            size="lg"
          >
            <Home size={20} color="#FFFFFF" />
            <Text className="text-primary-foreground text-base font-semibold ml-2">
              Go to Login
            </Text>
          </Button>

          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full py-3 px-4 rounded-lg border"
            style={{ borderColor: isDark ? '#374151' : '#D1D5DB' }}
          >
            <Text className="text-center font-medium" style={{ color: mutedColor }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Code */}
        <View className="mt-12 px-4 py-2 rounded-lg" style={{ backgroundColor: cardBg }}>
          <Text className="text-xs font-mono" style={{ color: mutedColor }}>
            Error 404 • Page Not Found
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
