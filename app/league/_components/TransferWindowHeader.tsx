import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const ROW_HEIGHT = 32;

function TransferWindowHeaderComponent({ label }: { label: string }) {
  const { surface, textRole, border } = useTheme();

  const headerStyle = useMemo(
    () => [
      tStyles.header,
      {
        backgroundColor: surface[2],
        borderBottomColor: border.subtle,
      },
    ],
    [surface, border],
  );

  return (
    <View style={headerStyle}>
      <Text style={[tStyles.label, { color: textRole.tertiary }]}>{label}</Text>
    </View>
  );
}

export const TransferWindowHeader = React.memo(
  TransferWindowHeaderComponent,
  (prevProps, nextProps) => prevProps.label === nextProps.label,
);

export const ROW_HEIGHT_TRANSFER_HEADER = ROW_HEIGHT;

const tStyles = StyleSheet.create({
  header: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
  },
});
