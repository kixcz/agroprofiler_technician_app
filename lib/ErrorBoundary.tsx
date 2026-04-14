/**
 * Error Boundary Component
 * Catches and handles errors gracefully with user-friendly messages
 */

import React, { ReactNode } from 'react';
import { View, ScrollView, Button } from 'react-native';
import { Text } from '@/components/ui/text';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Error boundary caught an error', {
      error: error.message,
      stack: errorInfo.componentStack,
    });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <View className="flex-1 bg-background">
          <ScrollView className="flex-1 justify-center p-4">
            <View className="gap-4">
              <Text className="text-center text-2xl font-bold text-destructive">
                Something went wrong
              </Text>
              <Text className="text-center text-base text-muted-foreground">
                We're sorry for the inconvenience. The app has encountered an unexpected error.
              </Text>

              {__DEV__ && (
                <View className="mt-4 rounded-lg bg-secondary p-3">
                  <Text className="font-mono text-sm font-bold text-foreground">
                    Error Details:
                  </Text>
                  <Text className="font-mono text-xs text-muted-foreground">
                    {this.state.error.message}
                  </Text>
                </View>
              )}

              <View className="mt-6 gap-2">
                <Button
                  title="Try Again"
                  onPress={this.resetError}
                  color="#007AFF"
                />
                <Button
                  title="Go Home"
                  onPress={() => {
                    this.resetError();
                    // Navigate to home - requires navigation context
                  }}
                  color="#666"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}
