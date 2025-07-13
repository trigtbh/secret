import * as React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export default function Display() {
    return (
        <View className="flex-1 justify-between" style={{ userSelect: 'none' }}>
            <View className="px-6 pb-3">
                <Text className="text-lg font-semibold text-foreground">Step 3: Preview & Display</Text>
                <Text className="text-sm text-muted-foreground mt-1">Control how your secret looks.</Text>
            </View>
            
            <View className="flex-1 px-6 justify-center items-center">
                <Text className="text-base italic text-center text-muted-foreground" style={{opacity: 0.5}}>
                    Display preview coming soon...
                </Text>
            </View>
        </View>
    );
}
