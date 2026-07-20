import { Text, type TextProps } from "react-native";

export function Title(props: TextProps) {
  return <Text {...props} style={[{ fontSize: 18, fontWeight: "600" }, props.style]} />;
}
