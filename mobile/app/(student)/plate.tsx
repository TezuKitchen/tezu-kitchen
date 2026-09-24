import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  CreditCard, 
  Banknote, 
  User, 
  Tag, 
  ArrowRight,
  ShieldCheck,
  Store,
  Sparkles,
  RefreshCw
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { typography, spacing, layout } from '../../src/theme';
import { ThemeColors } from '../../src/theme/colors';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getTransformedUrl } from '../../src/services/imageService';
import api from '../../src/services/api';

const CAMPUS_LOCATIONS = [
  'Patkai Hostel',
  'Nilachal Hostel',
  'Saraighat Hostel',
  'Subansiri Hostel',
  'Central Library',
  'Academic Complex',
];

const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}: ${message}`);
    }
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

export default function PlateScreen() {
  const router = useRouter();
  const cart = useCart();
  const { user, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile?.();
    }, [refreshProfile])
  );

  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Load saved addresses from user profile
  useEffect(() => {
    api.get('/users/profile')
      .then(res => {
        if (res.data?.data?.savedAddresses) {
          setSavedAddresses(res.data.data.savedAddresses);
          if (res.data.data.savedAddresses.length > 0 && !address) {
            setAddress(res.data.data.savedAddresses[0]);
          }
        }
      })
      .catch(e => console.warn('Could not fetch saved addresses:', e?.message || e));
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      const response = await api.get(`/promotions/validate?code=${promoCode.trim().toUpperCase()}&orderAmount=${cart.totalAmount}`);
      setDiscountAmount(response.data.data || 0);
    } catch (err: any) {
      setPromoError(err?.response?.data?.message || 'Invalid promo code');
      setDiscountAmount(0);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const deliveryFee = cart.totalAmount > 0 ? 30 : 0;
  const taxesAndCharges = Math.round(cart.totalAmount * 0.05);
  const grandTotal = Math.max(0, cart.totalAmount + deliveryFee + taxesAndCharges - discountAmount);

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'success') {
        setIsPlacingOrder(true);
        await api.post('/payments/razorpay/verify', {
          razorpayOrderId: data.razorpay_order_id,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpaySignature: data.razorpay_signature
        });
        
        setRazorpayHtml(null);
        await cart.clearCart();
        showAlert('Order Placed!', 'Your meal is on its way!', () => {
          if (currentOrderId) {
            router.replace(`/order/${currentOrderId}` as any);
          } else {
            router.replace('/(student)/orders');
          }
        });
      } else if (data.type === 'dismiss' || data.type === 'error') {
        setRazorpayHtml(null);
        setOrderError(data.error?.description || 'Payment cancelled or failed. Please try again.');
        showAlert('Payment Failed', data.error?.description || 'Payment cancelled or failed.');
        setIsPlacingOrder(false);
      }
    } catch (error: any) {
      console.error('Payment verification failed:', error);
      setRazorpayHtml(null);
      setOrderError(error?.response?.data?.message || 'Payment verification failed.');
      showAlert('Payment Failed', error?.response?.data?.message || 'Payment verification failed.');
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setAddressError('Please select or enter your campus delivery location');
      showAlert('Address Required', 'Please enter your room/hostel delivery address.');
      return;
    }

    if (!cart.restaurantId) {
      setOrderError('No restaurant selected. Please browse restaurants and add items.');
      showAlert('Error', 'No restaurant selected.');
      return;
    }

    setIsPlacingOrder(true);
    setAddressError('');
    setOrderError('');

    try {
      const fullDeliveryAddress = specialInstructions.trim() 
        ? `${address.trim()} (Note: ${specialInstructions.trim()})`
        : address.trim();

      const orderPayload = {
        restaurantId: cart.restaurantId,
        deliveryAddress: fullDeliveryAddress,
        items: cart.items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity
        }))
      };

      const orderResponse = await api.post('/orders', orderPayload);
      const orderId = orderResponse.data.data.id;
      setCurrentOrderId(orderId);

      if (paymentMethod === 'ONLINE') {
        const razorpayResponse = await api.post('/payments/razorpay/create-order', { orderId });
        const razorpayData = razorpayResponse.data.data;

        const options = {
          description: `Plate Order from ${cart.restaurantName}`,
          currency: razorpayData.currency,
          key: razorpayData.keyId,
          amount: razorpayData.amount,
          name: 'TezuKitchen',
          order_id: razorpayData.razorpayOrderId,
          prefill: {
            email: user?.email || 'student@tezu.ac.in',
            name: user?.name || 'Tezu Student',
            contact: user?.phone || '',
          },
          theme: { color: colors.primary },
        };

        const html = `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </head>
            <body style="background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <p style="font-family: sans-serif; color: #666;">Securing payment connection...</p>
              <script>
                var options = ${JSON.stringify(options)};
                options.handler = function (response){
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'success',
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_signature: response.razorpay_signature
                    }));
                };
                options.modal = {
                    ondismiss: function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismiss' }));
                    }
                };
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function (response){
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'error',
                      error: response.error
                    }));
                });
                rzp.open();
              </script>
            </body>
          </html>
        `;
        setRazorpayHtml(html);
        return;
      } else {
        await api.post('/payments', {
          orderId,
          method: paymentMethod,
        });

        await cart.clearCart();
        showAlert('Order Placed!', 'Your order has been sent to the kitchen!', () => {
          router.replace(`/order/${orderId}` as any);
        });
      }
    } catch (error: any) {
      console.error('Order placement failed:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to place order. Please try again.';
      setOrderError(errorMsg);
      showAlert('Order Failed', errorMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // EMPTY PLATE STATE
  if (cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Plate</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <UtensilsCrossed size={52} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your plate is empty</Text>
          <Text style={styles.emptySubtitle}>
            Explore hot meals, snacks, and beverages from your favourite campus kitchens.
          </Text>

          {/* User info snippet even when empty */}
          {user && (
            <View style={styles.emptyUserCard}>
              <View style={styles.userIconBadge}>
                {user.avatarUrl ? (
                  <Image 
                    source={{ uri: getTransformedUrl(user.avatarUrl, 'avatar-sm') }} 
                    style={styles.emptyUserAvatar} 
                    contentFit="cover" 
                  />
                ) : (
                  <User size={18} color={colors.primary} />
                )}
              </View>
              <View style={styles.emptyUserInfo}>
                <Text style={styles.emptyUserName}>{user.name}</Text>
                <Text style={styles.emptyUserEmail}>{user.email}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(student)' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Explore Campus Kitchens</Text>
            <ArrowRight size={18} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ACTIVE PLATE STATE
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Plate</Text>
          <Text style={styles.headerSubtitle}>{cart.totalItems} {cart.totalItems === 1 ? 'dish' : 'dishes'} selected</Text>
        </View>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={() => cart.clearCart()}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={colors.error} />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Status / Profile Bar */}
        <View style={styles.userSectionCard}>
          <View style={styles.userAvatarWrapper}>
            {user?.avatarUrl ? (
              <Image 
                source={{ uri: getTransformedUrl(user.avatarUrl, 'avatar-sm') }} 
                style={styles.userAvatar} 
                contentFit="cover" 
              />
            ) : (
              <View style={[styles.userAvatar, styles.userAvatarFallback]}>
                <User size={20} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.orderingForLabel}>ORDERING FOR</Text>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userContact}>{user?.phone || user?.email}</Text>
          </View>
          <View style={styles.badgeSync}>
            <ShieldCheck size={16} color={colors.secondary} />
            <Text style={styles.badgeSyncText}>Verified</Text>
          </View>
        </View>

        {/* Restaurant Header */}
        <View style={styles.restaurantCard}>
          <View style={styles.restaurantHeaderRow}>
            <Store size={20} color={colors.primary} />
            <Text style={styles.restaurantName} numberOfLines={1}>
              {cart.restaurantName || 'Campus Kitchen'}
            </Text>
          </View>
          <Text style={styles.restaurantTag}>Tezpur University Campus Partner</Text>
        </View>

        {/* Items List */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Dishes on Your Plate</Text>
          {cart.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity} (₹{item.price} each)</Text>
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityBtn}
                  onPress={() => cart.updateQuantity(item.id, item.quantity - 1)}
                  activeOpacity={0.7}
                >
                  <Minus size={14} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityBtn}
                  onPress={() => cart.updateQuantity(item.id, item.quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Delivery Location</Text>
          </View>

          {/* Quick campus chips */}
          <Text style={styles.subLabel}>Quick Select Hostel / Spot:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {CAMPUS_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locationChip, address.startsWith(loc) && styles.locationChipActive]}
                onPress={() => setAddress(loc)}
              >
                <Text style={[styles.locationChipText, address.startsWith(loc) && styles.locationChipTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Saved Addresses chips if available */}
          {savedAddresses.length > 0 && (
            <>
              <Text style={[styles.subLabel, { marginTop: spacing.sm }]}>Your Saved Addresses:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {savedAddresses.map((saved, idx) => (
                  <TouchableOpacity
                    key={`saved-${idx}`}
                    style={[styles.locationChip, address === saved && styles.locationChipActive]}
                    onPress={() => setAddress(saved)}
                  >
                    <Text style={[styles.locationChipText, address === saved && styles.locationChipTextActive]}>
                      {saved}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <TextInput
            style={[styles.input, addressError ? styles.inputError : null]}
            placeholder="Room No, Hostel Name, or campus spot..."
            placeholderTextColor={colors.textLight}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (addressError) setAddressError('');
            }}
          />
          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}

          {/* Special instructions */}
          <TextInput
            style={[styles.input, styles.instructionsInput]}
            placeholder="Cooking or delivery notes (optional)"
            placeholderTextColor={colors.textLight}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
          />
        </View>

        {/* Promo Code */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Tag size={18} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>Offers & Discounts</Text>
          </View>

          <View style={styles.promoContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter Promo Code"
              placeholderTextColor={colors.textLight}
              value={promoCode}
              onChangeText={(text) => {
                setPromoCode(text);
                setPromoError('');
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[styles.applyPromoBtn, !promoCode.trim() && styles.applyPromoBtnDisabled]}
              onPress={handleApplyPromo}
              disabled={isApplyingPromo || !promoCode.trim()}
            >
              {isApplyingPromo ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.applyPromoText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          {promoError ? <Text style={styles.errorText}>{promoError}</Text> : null}
          {discountAmount > 0 && (
            <View style={styles.promoSuccessRow}>
              <Sparkles size={16} color={colors.success} />
              <Text style={styles.promoSuccessText}>Applied! You saved ₹{discountAmount}</Text>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Payment Method</Text>

          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('COD')}
              activeOpacity={0.8}
            >
              <Banknote size={20} color={paymentMethod === 'COD' ? colors.primary : colors.textMuted} />
              <View style={styles.paymentOptionTextWrap}>
                <Text style={[styles.paymentOptionTitle, paymentMethod === 'COD' && styles.paymentOptionTitleActive]}>
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentOptionSub}>Pay cash when meal is delivered</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('ONLINE')}
              activeOpacity={0.8}
            >
              <CreditCard size={20} color={paymentMethod === 'ONLINE' ? colors.primary : colors.textMuted} />
              <View style={styles.paymentOptionTextWrap}>
                <Text style={[styles.paymentOptionTitle, paymentMethod === 'ONLINE' && styles.paymentOptionTitleActive]}>
                  Pay Online (UPI / Card)
                </Text>
                <Text style={styles.paymentOptionSub}>Instant, contactless payment via Razorpay</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Bill Breakdown</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{cart.totalAmount}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Govt Taxes & Packaging (5%)</Text>
            <Text style={styles.billValue}>₹{taxesAndCharges}</Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: colors.success }]}>Promo Discount</Text>
              <Text style={[styles.billValue, { color: colors.success }]}>-₹{discountAmount}</Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        {orderError ? (
          <View style={styles.orderErrorCard}>
            <Text style={styles.errorText}>{orderError}</Text>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.footerBar}>
        <View style={styles.footerTotalWrap}>
          <Text style={styles.footerTotalLabel}>Total to Pay</Text>
          <Text style={styles.footerTotalValue}>₹{grandTotal}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.checkoutBtn, isPlacingOrder && styles.checkoutBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
          activeOpacity={0.8}
        >
          {isPlacingOrder ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Text style={styles.checkoutBtnText}>
                {paymentMethod === 'ONLINE' ? 'Pay & Order' : 'Place Order'}
              </Text>
              <ArrowRight size={18} color={colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Razorpay WebView Modal */}
      {razorpayHtml && (
        <Modal visible={!!razorpayHtml} animationType="slide">
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Payment</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setRazorpayHtml(null)}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <WebView
              originWhitelist={['*']}
              source={{ html: razorpayHtml }}
              onMessage={handleWebViewMessage}
              style={{ flex: 1 }}
            />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: layout.radius.sm,
    gap: 4,
  },
  clearButtonText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.error,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  // User info card
  userSectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    marginBottom: spacing.md,
    ...layout.shadows.sm,
  },
  userAvatarWrapper: {
    marginRight: spacing.md,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarFallback: {
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  orderingForLabel: {
    fontFamily: typography.fonts.heading,
    fontSize: 9,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  userName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  userContact: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  badgeSync: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
    gap: 4,
  },
  badgeSyncText: {
    fontFamily: typography.fonts.heading,
    fontSize: 10,
    color: colors.secondary,
  },
  // Restaurant Card
  restaurantCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    marginBottom: spacing.md,
    ...layout.shadows.sm,
  },
  restaurantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  restaurantName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    flex: 1,
  },
  restaurantTag: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  // Section Cards
  sectionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    marginBottom: spacing.md,
    ...layout.shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardHeaderTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  itemPrice: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderSubtle,
    borderRadius: layout.radius.pill,
    paddingHorizontal: spacing.xs,
  },
  quantityBtn: {
    padding: spacing.xs,
  },
  quantityValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginHorizontal: spacing.sm,
  },
  // Address & Chips
  subLabel: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  locationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: layout.radius.pill,
    backgroundColor: colors.borderSubtle,
    marginRight: spacing.sm,
  },
  locationChipActive: {
    backgroundColor: colors.primary,
  },
  locationChipText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  locationChipTextActive: {
    color: colors.surface,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginTop: spacing.xs,
  },
  instructionsInput: {
    marginTop: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  // Promo
  promoContainer: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  applyPromoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyPromoBtnDisabled: {
    opacity: 0.5,
  },
  applyPromoText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.surface,
  },
  promoSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  promoSuccessText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xs,
    color: colors.success,
  },
  // Payment
  paymentOptions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  paymentOptionTextWrap: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  paymentOptionTitleActive: {
    color: colors.primary,
  },
  paymentOptionSub: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  // Bill Breakdown
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  billLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  billValue: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  grandTotalLabel: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  grandTotalValue: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.lg,
    color: colors.primary,
  },
  orderErrorCard: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: layout.radius.md,
    marginBottom: spacing.md,
  },
  // Bottom Sticky Bar
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    ...layout.shadows.md,
  },
  footerTotalWrap: {
    flex: 1,
  },
  footerTotalLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  footerTotalValue: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: layout.radius.pill,
    gap: spacing.sm,
    ...layout.shadows.brand,
  },
  checkoutBtnDisabled: {
    opacity: 0.7,
  },
  checkoutBtnText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.surface,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  emptyUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: layout.radius.md,
    marginBottom: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  userIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  emptyUserInfo: {
    flex: 1,
  },
  emptyUserName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  emptyUserEmail: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: layout.radius.pill,
    gap: spacing.sm,
    ...layout.shadows.brand,
  },
  browseButtonText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.surface,
  },
  // Modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalCloseText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.error,
  },
});
