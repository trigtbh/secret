// app.config.js
export default {
  expo: {
    name: "YourAppName",
    slug: "secret4",
    version: "1.0.0",
    plugins: [
      [
        "expo-font",
        {
          fonts: [
            "./node_modules/@react-native-vector-icons/fontawesome6/fonts/FontAwesome6_Regular.ttf"
            // Add more fonts here if needed
          ]
        }
      ]
    ]
  }
};
