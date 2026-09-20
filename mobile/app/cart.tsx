import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ArrowLeft, ShoppingBag, MapPin, CreditCard, Banknote, AlertCircle } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { colors, typography, spacing, layout } from '../src/theme';
import { useCart } from '../src/context/CartContext';
import api from '../src/services/api';

const CAMPUS_LOCATIONS = [
  'Patkai Hostel',
  'Nilachal Hostel',
  'Saraighat Hostel',
  'Subansiri Hostel',
  'Central Library',
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

export default function CartScreen() {
  const router = useRouter();
  const cart = useCart();
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [razorpayHtml, setRazorpayHtml] = useState<string | null>(null);
  
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);

  React.useEffect(() => {
    api.get('/users/profile')
      .then(res => {
         if (res.data?.data?.savedAddresses) {
           setSavedAddresses(res.data.data.savedAddresses);
         }
      })
      .catch(e => console.error('Failed to load saved addresses', e));
  }, []);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    setPromoError('');
    try {
      // Expecting { data: { data: 50 } } or similar (discountAmount)
      const response = await api.get(`/promotions/validate?code=${promoCode}&orderAmount=${cart.totalAmount}`);
      // Based on typical spring boot api response
      setDiscountAmount(response.data.data || 0);
    } catch (err: any) {
      setPromoError(err?.response?.data?.message || 'Invalid promo code');
      setDiscountAmount(0);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const deliveryFee = cart.totalAmount > 0 ? 30 : 0;
  const taxesAndCharges = cart.totalAmount * 0.05;
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
        cart.clearCart();
        showAlert('Order Placed!', 'Your order has been placed successfully!', () => {
          router.replace('/(student)/orders');
        });
        
        setTimeout(() => {
          router.replace('/(student)/orders');
        }, 500);
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
      setAddressError('Please enter your delivery address or pick a hostel below');
      showAlert('Address Required', 'Please enter your room/hostel delivery address.');
      return;
    }

    if (!cart.restaurantId) {
      setOrderError('Invalid restaurant. Please return to the menu and re-add your items.');
      showAlert('Error', 'Invalid restaurant');
      return;
    }

    setIsPlacingOrder(true);
    setAddressError('');
    setOrderError('');
    try {
      // 1. Create order
      const orderPayload = {
        restaurantId: cart.restaurantId,
        deliveryAddress: address.trim(),
        items: cart.items.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity
        }))
      };

      const orderResponse = await api.post('/orders', orderPayload);
      const orderId = orderResponse.data.data.id;

      // 2. Process payment
      if (paymentMethod === 'ONLINE') {
        const razorpayResponse = await api.post('/payments/razorpay/create-order', { orderId });
        const razorpayData = razorpayResponse.data.data;
        
        // // Developer Bypass for broken Razorpay Test Accounts
        // if (address === 'DEV_SUCCESS') {
        //   await api.post('/payments/razorpay/verify', {
        //     razorpayOrderId: razorpayData.razorpayOrderId,
        //     razorpayPaymentId: 'pay_dev_mock123',
        //     razorpaySignature: 'DEV_BYPASS'
        //   });
        //   
        //   cart.clearCart();
        //   showAlert('Order Placed!', 'Your order has been placed successfully! (Bypassed Gateway)', () => {
        //     router.replace('/(student)/orders');
        //   });
        //   
        //   setTimeout(() => {
        //     router.replace('/(student)/orders');
        //   }, 500);
        //   return;
        // }

        const options = {
          description: `Order from ${cart.restaurantName}`,
          currency: razorpayData.currency,
          key: razorpayData.keyId,
          amount: razorpayData.amount, // already in paise from backend
          name: 'TezuKitchen',
          order_id: razorpayData.razorpayOrderId,
          prefill: {
            email: 'student@tezu.ac.in',
            name: 'TezuKitchen Student',
          },
          theme: { color: '#FF5722' },
        };

        const html = `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </head>
            <body style="background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <p style="font-family: sans-serif; color: #666;">Loading secure payment gateway...</p>
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
        return; // Wait for WebView to handle the rest
      } else {
        const paymentPayload = {
          orderId,
          method: paymentMethod
        };
        await api.post('/payments', paymentPayload);

        cart.clearCart();
        showAlert('Order Placed!', 'Your order has been placed successfully!', () => {
          router.replace('/(student)/orders');
        });

        // Reliable navigation fallback for web
        setTimeout(() => {
          router.replace('/(student)/orders');
        }, 500);
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

  if (cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added any items yet.</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.back()}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.restaurantHeader}>
          <Text style={styles.restaurantName}>{cart.restaurantName}</Text>
        </View>

        <View style={styles.section}>
          {cart.items.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.vegIndicator}>
                <View style={styles.vegDot} />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => {
                    if (item.quantity === 1) cart.removeItem(item.id);
                    else cart.updateQuantity(item.id, item.quantity - 1);
                  }}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => cart.updateQuantity(item.id, item.quantity + 1)}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemSubtotal}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address *</Text>
          <View style={[styles.inputContainer, !!addressError && styles.inputContainerError]}>
            <MapPin size={20} color={addressError ? '#EF4444' : colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter hostel, room no. or landmark (required)"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (addressError) setAddressError('');
              }}
              placeholderTextColor={colors.textLight}
              multiline
            />
          </View>
          {!!addressError && (
            <Text style={styles.errorText}>{addressError}</Text>
          )}

          {/* Quick campus location chips */}
          <Text style={styles.chipHeader}>Or select a saved address:</Text>
          <View style={styles.chipContainer}>
            {[...savedAddresses, ...CAMPUS_LOCATIONS].map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.chip, address.includes(loc) && styles.chipActive]}
                onPress={() => {
                  setAddress(loc);
                  setAddressError('');
                }}
              >
                <Text style={[styles.chipText, address.includes(loc) && styles.chipTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Have a Promo Code?</Text>
          <View style={styles.promoContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter code (e.g. TEZU50)"
              value={promoCode}
              onChangeText={(text) => {
                setPromoCode(text.toUpperCase());
                setPromoError('');
              }}
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              style={[styles.promoButton, (!promoCode || isApplyingPromo) && styles.promoButtonDisabled]}
              onPress={handleApplyPromo}
              disabled={!promoCode || isApplyingPromo}
            >
              {isApplyingPromo ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text style={styles.promoButtonText}>Apply</Text>
              )}
            </TouchableOpacity>
          </View>
          {!!promoError && (
            <Text style={[styles.errorText, { marginTop: spacing.xs }]}>{promoError}</Text>
          )}
          {discountAmount > 0 && (
            <Text style={styles.promoSuccessText}>Promo code applied! Saved ₹{discountAmount}</Text>
          )}
        </View>

        {!!orderError && (
          <View style={styles.orderErrorBanner}>
            <AlertCircle size={18} color="#EF4444" />
            <Text style={styles.orderErrorText}>{orderError}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity 
              style={[styles.paymentMethodCard, paymentMethod === 'COD' && styles.paymentMethodCardActive]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Banknote size={24} color={paymentMethod === 'COD' ? colors.primary : colors.textMuted} />
              <Text style={[styles.paymentMethodText, paymentMethod === 'COD' && styles.paymentMethodTextActive]}>
                Cash on Delivery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.paymentMethodCard, paymentMethod === 'ONLINE' && styles.paymentMethodCardActive]}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <CreditCard size={24} color={paymentMethod === 'ONLINE' ? colors.primary : colors.textMuted} />
              <Text style={[styles.paymentMethodText, paymentMethod === 'ONLINE' && styles.paymentMethodTextActive]}>
                Pay Online
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{cart.totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes & Charges</Text>
            <Text style={styles.summaryValue}>₹{taxesAndCharges.toFixed(2)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>-₹{discountAmount}</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, isPlacingOrder && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder}
        >
          {isPlacingOrder ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Text style={styles.placeOrderAmount}>₹{grandTotal.toFixed(2)}</Text>
              <Text style={styles.placeOrderText}>Place Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={!!razorpayHtml} animationType="slide" onRequestClose={() => setRazorpayHtml(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
          {razorpayHtml && (
            <WebView
              originWhitelist={['*']}
              source={{ html: razorpayHtml }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={{ flex: 1 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.lg,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: layout.radius.md,
  },
  browseButtonText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
  },
  restaurantHeader: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  restaurantName: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.xl,
    color: colors.text,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  itemPrice: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.sm,
    height: 32,
    marginRight: spacing.md,
  },
  stepperButton: {
    paddingHorizontal: spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperButtonText: {
    color: colors.primary,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
  },
  quantityText: {
    color: colors.text,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.xs,
  },
  itemSubtotal: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.text,
    width: 60,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.md,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  chipHeader: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1EC',
  },
  chipText: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: typography.fonts.bodyMedium,
  },
  orderErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: layout.radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  orderErrorText: {
    flex: 1,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: '#B91C1C',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  paymentMethodCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  paymentMethodCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF1EC', // Light primary tint
  },
  paymentMethodText: {
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  paymentMethodTextActive: {
    color: colors.primary,
  },
  billContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  billLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  billValue: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  grandTotalLabel: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  grandTotalValue: {
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    ...layout.shadows.md,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    borderRadius: layout.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...layout.shadows.brand,
  },
  placeOrderButtonDisabled: {
    opacity: 0.7,
  },
  placeOrderAmount: {
    color: colors.surface,
    fontFamily: typography.fonts.headingExtra,
    fontSize: typography.sizes.md,
  },
  placeOrderText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.md,
  },
  promoContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: layout.radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.text,
    height: 48,
  },
  promoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: layout.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  promoButtonDisabled: {
    backgroundColor: colors.borderSubtle,
  },
  promoButtonText: {
    color: colors.surface,
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.sm,
  },
  promoSuccessText: {
    color: colors.success,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  summaryValue: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
});
