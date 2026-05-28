import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveAuth = async (token: string, email: string) => {
  await AsyncStorage.multiSet([
    ["token", token],
    ["email", email],
  ]);
};

export const getAuth = async () => {
  const vals = await AsyncStorage.multiGet(["token", "email"]);
  return { token: vals[0][1], email: vals[1][1] };
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove(["token", "email"]);
};
