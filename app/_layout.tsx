import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppleModalCloseButton } from '@/components/apple-modal-close-button';
import { Brand } from '@/constants/brand';
import { Copy } from '@/constants/copy';
import { AuthProvider } from '@/contexts/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Brand.canvas },
          headerTintColor: Brand.black,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 17,
          },
          contentStyle: { backgroundColor: Brand.canvas },
          headerBackTitle: Copy.back,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="camera"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="analyzing"
          options={{
            title: '形象测评',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="result"
          options={{
            title: Copy.resultTitle,
          }}
        />
        <Stack.Screen
          name="account"
          options={{
            title: '我的账户',
            presentation: 'modal',
            headerRight: () => <AppleModalCloseButton />,
          }}
        />
        <Stack.Screen
          name="profile-settings"
          options={{
            title: '我的信息',
            headerRight: () => <AppleModalCloseButton />,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: '登录',
            presentation: 'modal',
            headerRight: () => <AppleModalCloseButton />,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: '注册',
            presentation: 'modal',
            headerRight: () => <AppleModalCloseButton />,
          }}
        />
        <Stack.Screen
          name="legal/privacy"
          options={{
            title: '隐私政策',
            presentation: 'modal',
            headerRight: () => <AppleModalCloseButton />,
          }}
        />
        <Stack.Screen
          name="legal/terms"
          options={{
            title: '用户协议',
            presentation: 'modal',
            headerRight: () => <AppleModalCloseButton />,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
