import { useState, useCallback } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UseRazorpayResult {
  processPayment: (planId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useRazorpay(): UseRazorpayResult {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const processPayment = async (planId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Failed to load the Razorpay SDK. Please check your connection.");
      }

      const checkoutRes = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutData.success) {
        throw new Error(checkoutData.message || "Failed to initiate checkout");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        order_id: checkoutData.orderId,
        name: "Social Media app",
        description: "Subscription Upgrade",
        theme: {
          color: "#000000",
        },

        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/success", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              window.location.href = "/dashboard?upgrade=success"; 
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch {
            setError("Something went wrong while verifying your payment.");
          }
        },

        modal: {
          ondismiss: async function () {
            setIsLoading(false);
            await fetch("/api/razorpay/failed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ razorpay_order_id: checkoutData.orderId }),
            });
            setError("Payment was cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', async function (response: any) {
        await fetch("/api/razorpay/failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ razorpay_order_id: response.error.metadata.order_id }),
        });
        setError(response.error.description || "Payment failed");
      });

      rzp.open();

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return { processPayment, isLoading, error };
}