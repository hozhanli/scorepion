// Compat wrapper — falls back to plain ScrollView on every platform so the
// app keeps building under Expo Go (where react-native-keyboard-controller's
// native module isn't available). If a custom dev build is introduced,
// restore the KeyboardAwareScrollView import from react-native-keyboard-controller.
import { ScrollView, ScrollViewProps } from "react-native";

type Props = ScrollViewProps;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
