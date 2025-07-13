import * as React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export default function Options() {
    return (
        <View className="flex-1 justify-between" style={{ userSelect: 'none' }}>
            <View className="px-6 pb-3">
                <Text className="text-lg font-semibold text-foreground">Step 2: Configure Options</Text>
                <Text className="text-sm text-muted-foreground mt-1">Set a password and sharing options.</Text>
            </View>
            
            <View className="flex-1 px-6 justify-center items-center">
                <Text className="text-base italic text-center text-muted-foreground" style={{opacity: 0.5}}>
                    Options configuration coming soon...
                </Text>
            </View>
        </View>
    );
}
