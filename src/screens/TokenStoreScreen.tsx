import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import { StyledCard } from "../components/styled/StyledCard";
import { StyledIcon } from "../components/styled/StyledIcon";
import {
  spacing,
  typography,
  borderRadius,
  interaction,
} from "../constants/designSystem";
import { useTokens } from "../hooks/useTokens";
import { logger } from "../utils/logger";
import { fetchAvailableProducts } from "../services/tokenService";
import { IAPProduct } from "../types/iap";
import { useAuthContext } from "../contexts/AuthContext";

export function TokenStoreScreen() {
  const { theme } = useTheme();
  const styles = useThemedStyles();
  const { balance, loading: tokensLoading, buyTokens, refresh } = useTokens();
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const { isLoaded: authLoaded, isSignedIn } = useAuthContext();
  const { width } = useWindowDimensions();

  // Paywall-specific UX
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [successToastAboveOther, setSuccessToastAboveOther] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    if (!isSignedIn) {
      setProducts([]);
      setProductsError("Please sign in to view available products.");
      setProductsLoading(false);
      return;
    }

    loadProducts();
  }, [authLoaded, isSignedIn]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const fetchedProducts = await fetchAvailableProducts();
      setProducts(fetchedProducts);
      if (fetchedProducts.length === 0) {
        setProductsError('No products available');
      }
    } catch (error) {
      logger.error('Failed to load products', error);
      setProductsError('Failed to load products. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!successToast) return;

    // Cancel any previous toast timers
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    toastTimeoutRef.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setSuccessToast(null);
      });
      toastTimeoutRef.current = null;
    }, 3000);

    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [successToast, toastOpacity]);

  const getFeaturedProduct = (list: IAPProduct[]) => {
    const by700 = list.find((p) => p.credits === 700);
    if (by700) return by700;
    if (list.length >= 2) return list[1];
    return list[0] ?? null;
  };

  const getOtherProducts = (list: IAPProduct[], featured: IAPProduct | null) => {
    if (!featured) return list;
    return list.filter((p) => p.product_id !== featured.product_id);
  };

  const featuredProduct = useMemo(() => getFeaturedProduct(products), [products]);
  const otherProducts = useMemo(
    () => getOtherProducts(products, featuredProduct),
    [products, featuredProduct]
  );

  const handleBuyTokens = async (product: IAPProduct) => {
    setPurchasingProductId(product.product_id);
    try {
      const result = await buyTokens(product.product_id);
      
      if (result.success) {
        // Refresh balance and show success toast
        await refresh();
        const isFeatured = featuredProduct?.product_id === product.product_id;
        setSuccessToastAboveOther(!isFeatured);
        setSuccessToast(`Purchase successful! +${product.credits} credits added.`);
      } else {
        // Only show error alert for actual errors, not user cancellations
        if (!result.cancelled) {
          Alert.alert("Error", result.error || "Failed to purchase credits. Please try again.");
        }
        // Silently handle cancelled purchases - user intentionally cancelled, no need to notify
      }
    } catch (error) {
      logger.error("Error purchasing credits", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setPurchasingProductId(null);
    }
  };

  const isPurchasing = (productId: string) => purchasingProductId === productId;

  const otherCardGap = 16;
  const otherCardWidth = Math.max(140, (width - spacing.base * 2 - otherCardGap) / 2);

  const renderToast = (aboveOther: boolean) => {
    if (!successToast || successToastAboveOther !== aboveOther) return null;

    return (
      <Animated.View
        style={[
          localStyles.toastContainer,
          { opacity: toastOpacity, backgroundColor: theme.success },
          aboveOther ? localStyles.toastAboveOther : undefined,
        ]}
      >
        <Text style={[localStyles.toastText, { color: theme.background }]}>
          {successToast}
        </Text>
      </Animated.View>
    );
  };

  return (
    <ScrollView
      style={[styles.backgroundStyle, localStyles.container]}
      contentContainerStyle={localStyles.content}
    >
      {/* Balance Display */}
      <View style={localStyles.balanceSection}>
        <StyledCard backgroundColor={theme.card} style={localStyles.balanceCard}>
          <View style={localStyles.balanceContent}>
            <View style={[localStyles.balanceIconWrap, { backgroundColor: `${theme.primary}1A` }]}>
              <StyledIcon name="wallet-outline" size={24} color={theme.primary} />
            </View>
            <View style={localStyles.balanceText}>
              <Text style={[localStyles.balanceLabel, { color: theme.textSecondary }]}>
                Current Balance
              </Text>
              <Text style={[localStyles.balanceAmount, { color: theme.text }]}>
                {tokensLoading ? "Loading..." : balance !== null ? balance : "—"}{" "}
                <Text style={{ color: theme.primary }}>Credits</Text>
              </Text>
            </View>
          </View>
        </StyledCard>
      </View>

      {/* Token Packs */}
      <View style={localStyles.section}>
        {renderToast(false)}

        <Text style={[localStyles.sectionTitle, { color: theme.text }]}>
          Featured Deal
        </Text>

        {productsLoading ? (
          <View style={localStyles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[localStyles.loadingText, { color: theme.textSecondary }]}>
              Loading products...
            </Text>
          </View>
        ) : productsError ? (
          <StyledCard backgroundColor={theme.card}>
            <View style={localStyles.errorContainer}>
              <Text style={[localStyles.errorText, { color: theme.error }]}>
                {productsError}
              </Text>
              <TouchableOpacity
                onPress={loadProducts}
                style={[localStyles.retryButton, styles.buttonStyle]}
              >
                <Text style={[localStyles.retryButtonText, { color: theme.background }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          </StyledCard>
        ) : products.length === 0 ? (
          <StyledCard backgroundColor={theme.card}>
            <View style={localStyles.emptyContainer}>
              <Text style={[localStyles.emptyText, { color: theme.textSecondary }]}>
                No products available at this time.
              </Text>
            </View>
          </StyledCard>
        ) : (
          <>
            {/* Featured card */}
            {featuredProduct ? (
              <View style={localStyles.featuredCardWrap}>
                <View style={localStyles.mostPopularPill}>
                  <Ionicons name={"star"} size={12} color="#fff" />
                  <Text style={localStyles.mostPopularText}>MOST POPULAR</Text>
                </View>

                <StyledCard backgroundColor={theme.card} style={localStyles.featuredCard}>
                  <View style={[localStyles.featuredCardGradient, { backgroundColor: theme.primary }]}>
                    <Ionicons name={"star"} size={44} color="#fff" />
                  </View>

                  <View style={localStyles.featuredCardBody}>
                    <Text style={[localStyles.featuredCardName, { color: theme.text }]}>
                      {featuredProduct.display_name}
                    </Text>
                    <Text style={[localStyles.featuredCardTagline, { color: theme.textSecondary }]}>
                      Best value for your account
                    </Text>
                    <View style={localStyles.featuredCardPrices}>
                      <Text style={[localStyles.featuredCredits, { color: theme.primary }]}>
                        {featuredProduct.credits} Credits
                      </Text>
                      <Text style={[localStyles.featuredPrice, { color: theme.text }]}>
                        {featuredProduct.price_label}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        localStyles.featuredCta,
                        isPurchasing(featuredProduct.product_id) && localStyles.buttonDisabled,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={() => handleBuyTokens(featuredProduct)}
                      disabled={isPurchasing(featuredProduct.product_id) || tokensLoading || !isSignedIn}
                    >
                      {isPurchasing(featuredProduct.product_id) ? (
                        <ActivityIndicator size="small" color={theme.background} />
                      ) : (
                        <View style={localStyles.featuredCtaRow}>
                          <Text style={[localStyles.featuredCtaText, { color: theme.background }]}>
                            Get Best Deal Now
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </StyledCard>
              </View>
            ) : null}

            {/* Other cards */}
            {otherProducts.length > 0 ? (
              <>
                {renderToast(true)}

                <Text style={[localStyles.otherOptionsTitle, { color: theme.textSecondary }]}>
                  OTHER OPTIONS
                </Text>

                <View style={localStyles.otherGrid}>
                  {otherProducts.slice(0, 2).map((product, idx) => {
                    const purchasing = isPurchasing(product.product_id);
                    const disabled = purchasing || tokensLoading || !isSignedIn;
                    const iconName = idx === 0 ? "rocket-outline" : "diamond-outline";

                    return (
                      <View
                        key={product.product_id}
                        style={[localStyles.otherCard, { width: otherCardWidth }]}
                      >
                        <View
                          style={[
                            localStyles.otherCardGradient,
                            {
                              backgroundColor: idx === 0 ? theme.primary : theme.secondary,
                            },
                          ]}
                        >
                          <Ionicons name={iconName as any} size={26} color="#fff" />
                        </View>

                        <View style={localStyles.otherCardBody}>
                          <Text style={[localStyles.otherCardName, { color: theme.text }]}>
                            {product.display_name.replace(/\s+Pack$/, "")}
                          </Text>
                          <Text style={[localStyles.otherCardCredits, { color: theme.primary }]}>
                            {product.credits} Cr.
                          </Text>
                          <Text style={[localStyles.otherCardPrice, { color: theme.textSecondary }]}>
                            {product.price_label}
                          </Text>

                          <TouchableOpacity
                            style={[
                              localStyles.otherCardButton,
                              disabled && localStyles.buttonDisabled,
                            ]}
                            onPress={() => handleBuyTokens(product)}
                            disabled={disabled}
                          >
                            {purchasing ? (
                              <ActivityIndicator size="small" color={theme.textSecondary} />
                            ) : (
                              <Text style={[localStyles.otherCardButtonText, { color: theme.textSecondary }]}>
                                Choose
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* Disclaimer */}
            <View style={[localStyles.disclaimer, { backgroundColor: theme.border }]}>
              <Text style={[localStyles.disclaimerText, { color: theme.textSecondary }]}>
                Secure payment via App Store. Credits never expire and can be used
                for all premium features.
              </Text>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },

  balanceSection: { marginBottom: spacing.xl },
  balanceCard: {
    padding: spacing.base,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceText: { flex: 1 },
  balanceLabel: { fontSize: typography.fontSize.sm, marginBottom: spacing.xs / 2 },
  balanceAmount: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.base,
  },

  toastContainer: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    alignItems: "center",
  },
  toastAboveOther: { marginTop: spacing.xs },
  toastText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },

  featuredCardWrap: { marginBottom: spacing.xl, position: "relative" },
  mostPopularPill: {
    position: "absolute",
    top: -12,
    left: "50%",
    marginLeft: -70,
    width: 140,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F59E0B",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 9999,
  },
  mostPopularText: { fontSize: 11, fontWeight: typography.fontWeight.bold, color: "#78350F" },

  featuredCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  featuredCardGradient: { height: 120, alignItems: "center", justifyContent: "center" },
  featuredCardBody: { padding: 32, alignItems: "center" },
  featuredCardName: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, marginBottom: 4 },
  featuredCardTagline: { fontSize: typography.fontSize.sm, marginBottom: spacing.base },
  featuredCardPrices: { alignItems: "center", marginBottom: 32 },
  featuredCredits: { fontSize: 28, fontWeight: typography.fontWeight.bold, marginBottom: 4 },
  featuredPrice: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold },

  featuredCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
  },
  featuredCtaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  featuredCtaText: { fontSize: 18, fontWeight: typography.fontWeight.bold },

  otherOptionsTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: spacing.base,
  },
  otherGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.base, justifyContent: "center" },
  otherCard: { backgroundColor: "#fff", borderRadius: borderRadius.lg, overflow: "hidden", borderWidth: 1, borderColor: "#F1F5F9" },
  otherCardGradient: { height: 96, alignItems: "center", justifyContent: "center" },
  otherCardBody: { padding: spacing.base, alignItems: "center" },
  otherCardName: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  otherCardCredits: { fontSize: 18, fontWeight: typography.fontWeight.bold, marginTop: 2 },
  otherCardPrice: { fontSize: 12, marginTop: 2 },
  otherCardButton: {
    width: "100%",
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  otherCardButtonText: { fontSize: 12, fontWeight: typography.fontWeight.semibold },

  buttonDisabled: { opacity: interaction.disabledOpacity },

  disclaimer: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  disclaimerText: { fontSize: 11, lineHeight: 18, textAlign: "center" },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.base,
  },
  loadingText: { fontSize: typography.fontSize.base },
  errorContainer: { padding: spacing.base, alignItems: "center", gap: spacing.base },
  errorText: { fontSize: typography.fontSize.base, textAlign: "center" },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.sm },
  retryButtonText: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold },
  emptyContainer: { padding: spacing.base, alignItems: "center" },
  emptyText: { fontSize: typography.fontSize.base, textAlign: "center" },
});


