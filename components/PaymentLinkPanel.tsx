import cn from "clsx";
import { useState } from "react";
import { useRevalidator } from "react-router";
import { ButtonComponent } from "@syncfusion/ej2-react-buttons";
interface PaymentLinkPanelProps {
  tripId: string;
  initialPaymentLink: string | null;
  isInitialActive?: boolean; // optional prop from loader, default true if present
}

const PaymentLinkPanel = ({
  tripId,
  initialPaymentLink,
  isInitialActive = true,
}: PaymentLinkPanelProps) => {
  const revalidator = useRevalidator();
  const [paymentLink, setPaymentLink] = useState<string | null>(
    initialPaymentLink,
  );
  const [isLinkActive, setIsLinkActive] = useState<boolean>(
    Boolean(initialPaymentLink) && isInitialActive,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!paymentLink) return;

    if (!navigator?.clipboard?.writeText) {
      setErrorMessage(
        "Clipboard access is not supported or permitted in this browser.",
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentLink);
      setIsCopied(true);
      setErrorMessage(null);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: any) {
      console.error("Failed to copy payment link to clipboard:", err);
      setErrorMessage(
        "Failed to copy link to clipboard. Please copy it manually.",
      );
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!tripId || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/retry-trip-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate payment link");
      }

      setPaymentLink(result.payment_link);
      setIsLinkActive(true);
      revalidator.revalidate();
    } catch (err: any) {
      console.error("Error creating payment link:", err);
      setErrorMessage("Failed to generate payment link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isUsable = paymentLink && isLinkActive;

  return (
    <section className="wrapper-md border-light-400 container mb-6 rounded-2xl border bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="p-18-semibold text-dark-100">Payment Link Status</h2>
          <p className="max-w-md text-sm text-gray-100">
            {isUsable
              ? "This trip has an active Stripe payment link configured."
              : paymentLink && !isLinkActive
                ? "The existing payment link is inactive in Stripe. Generate a new active link below."
                : "No payment link found. Users will see 'Not available now' unless a payment link is added."}
          </p>
        </div>
        <div className="flex items-center gap-3 max-sm:justify-between">
          {isUsable ? (
            <>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="button-class-secondary inline-flex h-10 items-center justify-center px-4"
              >
                <span className="p-14-medium cursor-pointer hover:underline">
                  View Link
                </span>
              </a>
              <ButtonComponent
                type="button"
                onClick={handleCopyLink}
                className="button-class inline-flex h-10! items-center justify-center px-4!"
                title="Copy Link to Clipboard"
              >
                <span className="p-14-medium text-white">
                  {isCopied ? "Copied!" : "Copy Link"}
                </span>
              </ButtonComponent>
            </>
          ) : (
            <ButtonComponent
              type="button"
              disabled={isLoading}
              onClick={handleGeneratePaymentLink}
              className={cn(
                "button-class inline-flex h-10! items-center justify-center gap-2! px-5!",
                isLoading && "cursor-not-allowed! opacity-75!",
              )}
            >
              {isLoading ? (
                <>
                  <img
                    src="/assets/icons/loader.svg"
                    alt="loader icon"
                    className="size-4 animate-spin"
                  />
                  <span className="p-14-medium text-white">Generating...</span>
                </>
              ) : (
                <>
                  <img
                    src="/assets/icons/plus.svg"
                    alt=""
                    aria-hidden="true"
                    className="size-4 brightness-0 invert"
                  />
                  <span className="p-14-medium text-white">
                    {paymentLink ? "Replace Inactive Link" : "Add Link"}
                  </span>
                </>
              )}
            </ButtonComponent>
          )}
        </div>
      </div>
      {errorMessage && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
    </section>
  );
};

export default PaymentLinkPanel;
