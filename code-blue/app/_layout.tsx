import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{
          title: "login"
         }} 
      />
      <Stack.Screen 
        name="signUp" 
        options={{
          title: "signUp"
         }} 
      />
      <Stack.Screen 
        name="timeline" 
        options={{
          title: "Timeline"
        }} 
      />
    </Stack>
  );
}
