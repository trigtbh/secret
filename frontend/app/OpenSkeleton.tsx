import * as React from 'react';
import { View, Platform } from 'react-native';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';

interface OpenSkeletonProps {
  // Add any props you need for the skeleton
}

export default function OpenSkeleton({}: OpenSkeletonProps) {
    const { isDarkColorScheme } = useColorScheme();

    const WrapperComponent = Platform.OS === 'web' ? View : View;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: 'flex-1 justify-between', style: { userSelect: 'none' } }
        : { className: 'flex-1 justify-between', style: { userSelect: 'none' } };

    return (
        <WrapperComponent {...wrapperProps}>
            <View className="flex-1 px-6 pb-6">
                <View className="flex-1 rounded-lg border border-border bg-card p-6 gap-4 items-center justify-center">
                    {/* Add skeleton UI elements here */}
                    <View className="w-full max-w-xs items-center">
                        <Text className="text-base text-muted-foreground mb-1">Loading...</Text>
                    </View>
                </View>
            </View>
        </WrapperComponent>
    );
}
