/**
 * Groups Screen — Emerald Minimalism.
 *
 * Unified ScreenHeader + FilterSegmented (My / Discover). Group cards are
 * white with a 1px hairline border — no violet hero, no washEmerald stripes,
 * no softShadow helpers. Create flow uses the Button primitive and the
 * standard 54px input treatment.
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Pressable,
} from "react-native";
import { crossAlert } from "@/lib/cross-alert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// Animated import removed — tab screen renders instantly, no entry animations
import { useQuery, useMutation } from "@tanstack/react-query";
import Colors, { accent, radii } from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest, queryClient } from "@/lib/query-client";
import { haptics } from "@/lib/motion";
import { PressableScale, ScreenHeader, FilterSegmented, Button, EmptyState } from "@/components/ui";
import { useApp } from "@/contexts/AppContext";

interface ApiGroup {
  id: string;
  name: string;
  code: string;
  isPublic: boolean;
  memberCount: number;
  leagueIds: string[];
  createdBy: string;
  createdAt: number;
  joined?: boolean;
}

function LeagueTag({ leagueId, small }: { leagueId: string; small?: boolean }) {
  const { surface, textRole } = useTheme();
  const { leagues } = useApp();
  const league = leagues.find((l) => l.id === leagueId);
  if (!league) return null;
  const logo = league.logo || undefined;
  return (
    <View
      style={[styles.leagueTag, { backgroundColor: surface[2] }, small && styles.leagueTagSmall]}
    >
      {logo && (
        <Image source={{ uri: logo }} style={{ width: 14, height: 14 }} resizeMode="contain" />
      )}
      {!small && (
        <Text style={[styles.leagueTagText, { color: textRole.secondary }]}>{league.name}</Text>
      )}
    </View>
  );
}

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, tt } = useLanguage();
  const { surface, border, textRole } = useTheme();
  const { leagues } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [tab, setTab] = useState<"my" | "discover">("my");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [newlyCreatedGroupId, setNewlyCreatedGroupId] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 24 : insets.top;

  const { data: myGroups = [] } = useQuery<ApiGroup[]>({
    queryKey: ["/api/groups"],
    retry: false,
  });

  const { data: discoverGroups = [] } = useQuery<ApiGroup[]>({
    queryKey: ["/api/groups/discover"],
  });

  const joinedIds = new Set(myGroups.map((g) => g.id));
  const publicGroupsFiltered = discoverGroups.filter((g) => !joinedIds.has(g.id));

  const joinMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/discover"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/discover"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; isPublic: boolean; leagueIds: string[] }) => {
      const res = await apiRequest("POST", "/api/groups", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/discover"] });
      if (data?.id) {
        setNewlyCreatedGroupId(data.id);
        setTimeout(() => setNewlyCreatedGroupId(null), 4000);
      }
    },
  });

  const toggleLeague = (id: string) => {
    setSelectedLeagues((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  const handleCreate = useCallback(async () => {
    if (!newGroupName.trim() || selectedLeagues.length === 0) return;
    haptics.success();
    createMutation.mutate({ name: newGroupName.trim(), isPublic, leagueIds: selectedLeagues });
    setNewGroupName("");
    setSelectedLeagues([]);
    setShowCreate(false);
  }, [newGroupName, isPublic, selectedLeagues, createMutation]);

  const handleJoin = useCallback(
    async (group: ApiGroup) => {
      haptics.medium();
      joinMutation.mutate(group.id);
    },
    [joinMutation],
  );

  const handleLeave = useCallback(
    async (groupId: string) => {
      crossAlert("Leave Group", "Are you sure you want to leave this group?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            haptics.medium();
            leaveMutation.mutate(groupId);
          },
        },
      ]);
    },
    [leaveMutation],
  );
  void handleLeave;

  const navigateToGroup = useCallback(
    (group: ApiGroup) => {
      haptics.light();
      router.push({
        pathname: "/group/[id]",
        params: {
          id: group.id,
          name: group.name,
          code: group.code,
          memberCount: String(group.memberCount),
          isPublic: String(group.isPublic),
          leagueIds: JSON.stringify(group.leagueIds || []),
        },
      });
    },
    [router],
  );

  const filteredMyGroups = useMemo(() => {
    if (!searchQuery.trim()) return myGroups;
    const q = searchQuery.trim().toLowerCase();
    return myGroups.filter(
      (g) => g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
    );
  }, [myGroups, searchQuery]);

  const filteredDiscoverGroups = useMemo(() => {
    if (!searchQuery.trim()) return publicGroupsFiltered;
    const q = searchQuery.trim().toLowerCase();
    return publicGroupsFiltered.filter(
      (g) => g.code.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
    );
  }, [publicGroupsFiltered, searchQuery]);

  const renderGroupCard = (group: ApiGroup, idx: number, variant: "joined" | "discover") => {
    const leagueLogo =
      group.leagueIds?.length === 1
        ? leagues.find((l) => l.id === group.leagueIds[0])?.logo
        : undefined;
    const isNewlyCreated = group.id === newlyCreatedGroupId;

    return (
      <View key={group.id}>
        {isNewlyCreated && (
          <View style={[styles.newGroupBanner, { backgroundColor: accent.primary }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.newGroupBannerText}>{t.groupInvite.newGroupBanner}</Text>
          </View>
        )}
        <PressableScale onPress={() => navigateToGroup(group)}>
          <View
            style={[
              styles.groupCard,
              { backgroundColor: surface[0], borderColor: border.subtle },
              isNewlyCreated && styles.groupCardHighlighted,
            ]}
          >
            <View style={styles.groupCardTop}>
              <View style={styles.groupIcon}>
                {leagueLogo ? (
                  <Image
                    source={{ uri: leagueLogo }}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={group.isPublic ? "people" : "lock-closed"}
                    size={20}
                    color={accent.primary}
                  />
                )}
              </View>
              <View style={styles.groupInfo}>
                <Text style={[styles.groupName, { color: textRole.primary }]} numberOfLines={1}>
                  {group.name}
                </Text>
                <View style={styles.groupMetaRow}>
                  <Ionicons name="people-outline" size={12} color={textRole.tertiary} />
                  <Text style={[styles.groupMetaText, { color: textRole.tertiary }]}>
                    {group.memberCount}{" "}
                    {group.memberCount === 1 ? t.groups.member : t.groups.members}
                  </Text>
                  <Text style={[styles.groupMetaDot, { color: textRole.tertiary }]}>·</Text>
                  <Text style={[styles.groupMetaText, { color: textRole.tertiary }]}>
                    {group.code}
                  </Text>
                </View>
              </View>
              {variant === "discover" ? (
                <PressableScale
                  onPress={() => handleJoin(group)}
                  hitSlop={6}
                  haptic="medium"
                  pressedScale={0.92}
                >
                  <View style={styles.joinBtn}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </View>
                </PressableScale>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={textRole.tertiary} />
              )}
            </View>

            {group.leagueIds && group.leagueIds.length > 0 && (
              <View style={styles.leagueTagsRow}>
                {group.leagueIds.map((lid) => (
                  <LeagueTag key={lid} leagueId={lid} />
                ))}
              </View>
            )}
          </View>
        </PressableScale>
      </View>
    );
  };

  const activeList = tab === "my" ? filteredMyGroups : filteredDiscoverGroups;
  const myCount = myGroups.length;
  const discoverCount = publicGroupsFiltered.length;

  return (
    <View style={[styles.container, { backgroundColor: surface[1], paddingTop: topPad }]}>
      <ScreenHeader
        title={t.groups.title}
        subtitle={tt(t.groups.headerSubtitle, { joined: myCount, discover: discoverCount })}
        showLogo
        right={
          <PressableScale
            onPress={() => setShowCreate(true)}
            hitSlop={8}
            haptic="light"
            pressedScale={0.92}
          >
            <View style={styles.headerAction}>
              <Ionicons name="add" size={20} color={accent.primary} />
            </View>
          </PressableScale>
        }
      />

      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: surface[0], borderColor: border.subtle },
            searchFocused && { borderColor: accent.primary },
          ]}
        >
          <Ionicons
            name="search"
            size={16}
            color={searchFocused ? accent.primary : textRole.tertiary}
          />
          <TextInput
            style={[styles.searchInput, { color: textRole.primary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t.groups.search}
            placeholderTextColor={textRole.tertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            selectionColor={accent.primary}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t.a11y.close}
            >
              <Ionicons name="close-circle" size={18} color={textRole.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.filterWrap}>
        <FilterSegmented
          items={[
            { value: "my", label: t.groups.myGroups, count: myCount },
            { value: "discover", label: t.groups.discover, count: discoverCount },
          ]}
          value={tab}
          onChange={(v) => setTab(v as "my" | "discover")}
        />
      </View>

      <FlatList
        data={activeList}
        renderItem={({ item, index }) =>
          renderGroupCard(item as ApiGroup, index, tab === "my" ? "joined" : "discover")
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === "web" ? 110 : 120 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={tab === "my" ? "people-outline" : "compass-outline"}
              title={
                searchQuery.trim()
                  ? t.groups.noMatching
                  : tab === "my"
                    ? t.groups.noGroups
                    : t.groups.noPublic
              }
              subtitle={
                searchQuery.trim()
                  ? t.groups.tryDifferentSearch
                  : tab === "my"
                    ? t.groups.createOrJoin
                    : t.groups.beFirst
              }
            />
            {!searchQuery.trim() && tab === "my" && (
              <View style={styles.emptyCta}>
                <Button
                  title={t.groups.createGroupBtn}
                  onPress={() => setShowCreate(true)}
                  variant="primary"
                  size="md"
                  icon="add"
                  iconPosition="leading"
                />
              </View>
            )}
          </View>
        }
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalContent, { backgroundColor: surface[0] }]}>
            <View style={[styles.modalHandle, { backgroundColor: surface[2] }]} />
            <Text style={[styles.modalTitle, { color: textRole.primary }]}>{t.groups.create}</Text>

            <Text style={[styles.inputLabel, { color: textRole.secondary }]}>
              {t.groups.groupName}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: surface[1],
                  borderColor: border.subtle,
                  color: textRole.primary,
                },
              ]}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder={t.groups.enterGroupName}
              placeholderTextColor={textRole.tertiary}
              maxLength={30}
              selectionColor={accent.primary}
            />

            <Text style={[styles.inputLabel, { marginTop: 20, color: textRole.secondary }]}>
              {t.groups.leaguesLabel}
            </Text>
            <Text style={[styles.inputHint, { color: textRole.tertiary }]}>
              {t.groups.selectLeagues}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.leagueSelectScroll}
              contentContainerStyle={styles.leagueSelectRow}
            >
              {leagues.map((league) => {
                const selected = selectedLeagues.includes(league.id);
                return (
                  <Pressable
                    key={league.id}
                    onPress={() => {
                      haptics.light();
                      toggleLeague(league.id);
                    }}
                    style={[
                      styles.leagueSelectChip,
                      { backgroundColor: surface[1], borderColor: border.subtle },
                      selected && styles.leagueSelectChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.leagueSelectText,
                        { color: textRole.secondary },
                        selected && styles.leagueSelectTextActive,
                      ]}
                    >
                      {league.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 20, color: textRole.secondary }]}>
              {t.groups.visibility}
            </Text>
            <View style={styles.visibilityRow}>
              <Pressable
                onPress={() => setIsPublic(true)}
                style={[
                  styles.visibilityBtn,
                  { backgroundColor: surface[1], borderColor: border.subtle },
                  isPublic && styles.visibilityBtnActive,
                ]}
              >
                <Ionicons name="earth" size={18} color={isPublic ? "#fff" : textRole.tertiary} />
                <Text style={[styles.visibilityText, isPublic && styles.visibilityTextActive]}>
                  {t.groups.public}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsPublic(false)}
                style={[styles.visibilityBtn, !isPublic && styles.visibilityBtnActive]}
              >
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={!isPublic ? "#fff" : textRole.tertiary}
                />
                <Text style={[styles.visibilityText, !isPublic && styles.visibilityTextActive]}>
                  {t.groups.private}
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Button
                title={t.common.cancel}
                onPress={() => {
                  setShowCreate(false);
                  setSelectedLeagues([]);
                  setNewGroupName("");
                }}
                variant="secondary"
                size="md"
                fullWidth
              />
              <Button
                title={t.groups.createNew}
                onPress={handleCreate}
                disabled={!newGroupName.trim() || selectedLeagues.length === 0}
                variant="primary"
                size="md"
                icon="checkmark"
                iconPosition="leading"
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
  searchWrap: {
    paddingHorizontal: 20,
    marginTop: -4,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  searchBarFocus: {},
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    padding: 0,
  },

  // Filter
  filterWrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // List + card
  list: { paddingTop: 4, paddingHorizontal: 20 },
  groupCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  groupCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 166, 81, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  groupInfo: { flex: 1 },
  groupName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  groupMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  groupMetaText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  groupMetaDot: {
    fontSize: 11,
  },
  joinBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // League tag pills
  leagueTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  leagueTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leagueTagSmall: { paddingHorizontal: 5, paddingVertical: 2 },
  leagueTagText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  // Empty
  emptyWrap: {
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyCta: {
    marginTop: 16,
    width: 200,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
    marginTop: -4,
  },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
  },
  leagueSelectScroll: { flexGrow: 0 },
  leagueSelectRow: { gap: 8 },
  leagueSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  leagueSelectChipActive: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  leagueSelectText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  leagueSelectTextActive: { color: "#fff" },
  visibilityRow: { flexDirection: "row", gap: 10 },
  visibilityBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  visibilityBtnActive: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  visibilityText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  visibilityTextActive: { color: "#fff" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
  },
  newGroupBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 12,
  },
  newGroupBannerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#fff",
    flex: 1,
  },
  groupCardHighlighted: {
    borderColor: accent.primary,
    borderWidth: 2,
  },
});

// Silence unused import warnings for tokens reserved for future additive work.
void Colors;
