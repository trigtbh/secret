import * as React from 'react';
import { View, Pressable, Platform, Keyboard } from 'react-native';
import { Text } from '~/components/ui/text';

export default function Display() {
    const WrapperComponent = Platform.OS === 'web' ? View : Pressable;
    const wrapperProps = Platform.OS === 'web' 
        ? { className: "flex-1 justify-between", style: { userSelect: 'none' } }
        : { 
            className: "flex-1 justify-between", 
            style: { userSelect: 'none' },
            onPress: () => Keyboard.dismiss()
          };

    return (
        <WrapperComponent {...wrapperProps}>
            <View className="px-6 pb-3">
                <Text className="text-lg font-semibold text-foreground">Step 3: Preview & Display</Text>
                <Text className="text-sm text-muted-foreground mt-1">Control how your secret looks.</Text>
            </View>
            
            <View className="flex-1 px-6 justify-center items-center">
                <Text className="text-base italic text-center text-muted-foreground" style={{opacity: 0.5}}>
                    Display options coming soon...
                </Text>
            </View>
        </WrapperComponent>
    );
}
