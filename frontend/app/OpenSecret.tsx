import * as React from 'react';
import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import Ionicon from "@expo/vector-icons/Ionicons";

interface OpenSecretProps {
    onBack?: () => void;
    showContent?: boolean;
}

export default function OpenSecret({ onBack, showContent = true }: OpenSecretProps) {
    return (
        <SafeAreaView className="flex-1 justify-center items-center gap-5 bg-background">
            {showContent && (
            <Animated.View 
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
                className="w-full max-w-sm mx-4"
            >
                <Card className="w-full max-w-sm rounded-2xl">
                    <CardHeader className="pb-3.5 flex-row justify-between items-center">
                        <CardTitle className="text-4xl">Open Secret</CardTitle>
                        <Image 
                            source={require('~/icons/web/icon.png')} 
                            style={{width: 48, height: 48, borderRadius: 12}}
                            resizeMode="contain"
                        />
                    </CardHeader>
                    
                    <CardContent className="min-h-[350px] sm:min-h-[300px] flex-1 justify-center items-center gap-4">
                        <Ionicon name="folder-open-outline" size={64} color="#6b7280" />
                        <Text className="text-lg text-center text-muted-foreground">
                            Open Secret functionality coming soon...
                        </Text>
                        <Text className="text-sm text-center text-muted-foreground px-4">
                            This feature will allow you to retrieve and decrypt files using a secret ID.
                        </Text>
                    </CardContent>
                    
                    <View className="p-4">
                        <Button 
                            onPress={onBack}
                            className="w-full"
                            variant="outline"
                        >
                            <Text>Back to Home</Text>
                        </Button>
                    </View>
                </Card>
            </Animated.View>
            )}
        </SafeAreaView>
    );
}
