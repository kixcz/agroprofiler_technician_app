import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import * as React from 'react';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HAS_ONBOARDED_KEY = 'agro_has_completed_onboarding';

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Register Farmers Easily',
    description:
      'Enroll agricultural producers, update verified farmer records, and manage profile registries on-site.',
    image: require('@/assets/images/illus_register_clipboard.jpg'),
  },
  {
    id: '2',
    title: 'Monitor Crops in Real Time',
    description:
      'Track cultivation progress, log farm parcel observations, and record damage assessments directly from the field.',
    image: require('@/assets/images/illus_technician_tablet.jpg'),
  },
  {
    id: '3',
    title: 'Schedule Field Operations',
    description:
      'Organize distribution batches, plan barangay inspection visits, and maintain timely monitoring routines.',
    image: require('@/assets/images/illus_calendar_schedule.jpg'),
  },
  {
    id: '4',
    title: 'Work Anywhere, Even Offline',
    description:
      'Collect geotagged field reports in remote barangays without cellular service and auto-sync when online.',
    image: require('@/assets/images/illus_cloud_sync.jpg'),
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const completeOnboarding = async (targetRoute: '/' | '/register') => {
    try {
      await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save onboarding flag:', e);
    }
    if (targetRoute === '/register') {
      router.replace('/register');
    } else {
      router.replace('/');
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding('/');
    }
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex >= 0 && newIndex < SLIDES.length) {
      setCurrentIndex(newIndex);
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background Top Field Scene */}
      <View style={styles.topLandscapeContainer}>
        <Image
          source={require('@/assets/images/agro_field_header.png')}
          style={styles.topLandscapeImage}
          resizeMode="cover"
        />

        {/* Floating Skip button */}
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => completeOnboarding('/')}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Agro Mobile Emblem & Title */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoCircleOuter}>
            <View style={styles.logoCircleInner}>
              <Image
                source={require('@/assets/images/app_logo_transparent.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.appTitle}>Agro Mobile</Text>
          <Text style={styles.appSubtitle}>Technician Field Operations</Text>
        </View>
      </View>

      {/* Main Curved White Card Sheet */}
      <View style={styles.bottomCardSheet}>
        {/* Paged Content Carousel */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          style={styles.carouselList}
          renderItem={({ item }) => (
            <View style={[styles.slideItem, { width: SCREEN_WIDTH - 24 }]}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideDescription}>{item.description}</Text>

              <View style={styles.illustrationCard}>
                <Image
                  source={item.image}
                  style={styles.illustrationImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}
        />

        {/* Carousel Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={styles.primaryButtonText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => completeOnboarding('/')}
          >
            <View style={styles.secondaryContent}>
              <LogIn size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryText}>
                Already have an account?{' '}
                <Text style={styles.secondaryBoldText}>Sign In</Text>
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E6F38',
  },
  topLandscapeContainer: {
    height: 280,
    width: '100%',
    position: 'relative',
    backgroundColor: '#2F855A',
  },
  topLandscapeImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  skipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
  logoCircleOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoCircleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  bottomCardSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -28,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  carouselList: {
    flex: 1,
  },
  slideItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slideTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#132A1C',
    textAlign: 'center',
    marginBottom: 4,
  },
  slideDescription: {
    fontSize: 13,
    color: '#4B6354',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  illustrationCard: {
    width: '100%',
    height: 225,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F3F9F5',
    borderWidth: 1,
    borderColor: '#E2F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#059669',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#059669',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  secondaryBoldText: {
    color: '#059669',
    fontWeight: '800',
  },
});
