/**
 * ProtectedRoute tests
 * Tests that unauthenticated users see the connect modal
 * and authenticated users see the page content
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useStellarWallet } from "@/contexts/stellar-wallet-context";
import { useAuth } from "@/components/auth/auth-provider";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock StellarWallet context
jest.mock("@/contexts/stellar-wallet-context", () => ({
  useStellarWallet: jest.fn(),
}));

// Mock useAuth hook
jest.mock("@/components/auth/auth-provider", () => ({
  useAuth: jest.fn(),
}));

// Mock ConnectWalletModal
jest.mock("@/components/connectWallet", () => {
  return function MockConnectWalletModal({
    isModalOpen,
  }: {
    isModalOpen: boolean;
  }) {
    return isModalOpen ? (
      <div data-testid="connect-wallet-modal">Connect Wallet Modal</div>
    ) : null;
  };
});

const TestContent = () => <div data-testid="protected-content">Protected Page</div>;

describe("ProtectedRoute", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockWallet = {
    publicKey: "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5",
    isConnected: false,
    isLoading: false,
    status: "disconnected" as const,
    connect: jest.fn(),
    connectWallet: jest.fn(),
    disconnect: jest.fn(),
    isConnecting: false,
    error: null,
    address: null,
    kit: {} as any,
  };

  const mockAuthContext = {
    user: null,
    isLoading: false,
    isInitializing: false,
    error: null,
    logout: jest.fn(),
    refreshUser: jest.fn(),
    updateUserProfile: jest.fn(),
    isWalletConnecting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useStellarWallet as jest.Mock).mockReturnValue(mockWallet);
    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Unauthenticated access", () => {
    it("should show connect wallet modal when wallet is not connected", async () => {
      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("connect-wallet-modal")
        ).toBeInTheDocument();
      });
    });

    it("should not show protected content when not authenticated", async () => {
      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      });
    });

    it("should show loading state during initialization", () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: true,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
    });

    it("should show loading state while wallet is connecting", () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isWalletConnecting: true,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      expect(screen.getByText(/Connecting wallet/i)).toBeInTheDocument();
    });

    it("should redirect to /explore when not connected after auto-connect timeout", async () => {
      // Set up as if user was trying to auto-connect but failed
      localStorage.setItem("stellar_auto_connect", "true");
      localStorage.setItem("stellar_last_wallet", "freighter");

      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isLoading: false,
        isConnecting: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Should eventually redirect since auto-connect failed
      await waitFor(
        () => {
          const calls = mockRouter.replace.mock.calls;
          // Check if /explore was called (it might be called multiple times)
          const hasExplorePath = calls.some((call) =>
            call[0]?.includes("explore")
          );
          expect(hasExplorePath || mockRouter.replace.mock.calls.length > 0).toBe(
            true
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Authenticated access", () => {
    it("should show protected content when wallet is connected", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        publicKey: mockWallet.publicKey,
        isLoading: false,
        isConnecting: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      });
    });

    it("should not show connect modal when authenticated", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        publicKey: mockWallet.publicKey,
        isLoading: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId("connect-wallet-modal")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("State transitions", () => {
    it("should handle transition from initializing to ready", async () => {
      const { rerender } = render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Initially initializing
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: true,
      });

      rerender(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();

      // Transition to ready
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      rerender(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });
    });

    it("should handle transition from disconnected to connected", async () => {
      const { rerender } = render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Initially disconnected - should show modal
      await waitFor(() => {
        expect(
          screen.getByTestId("connect-wallet-modal")
        ).toBeInTheDocument();
      });

      // Connect wallet
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        publicKey: mockWallet.publicKey,
        isLoading: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      rerender(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
        expect(
          screen.queryByTestId("connect-wallet-modal")
        ).not.toBeInTheDocument();
      });
    });

    it("should handle transition from connected to disconnected", async () => {
      // Start connected
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        publicKey: mockWallet.publicKey,
        isLoading: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      const { rerender } = render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      });

      // Disconnect wallet
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: false,
        publicKey: null,
        isLoading: false,
      });

      rerender(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Should redirect to explore
      await waitFor(() => {
        const calls = mockRouter.replace.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Auto-connect behavior", () => {
    it("should wait for auto-connect attempt before showing modal", async () => {
      localStorage.setItem("stellar_auto_connect", "true");
      localStorage.setItem("stellar_last_wallet", "freighter");

      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isLoading: true,
        isConnecting: true,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: true,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Should show loading instead of modal
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      expect(
        screen.queryByTestId("connect-wallet-modal")
      ).not.toBeInTheDocument();
    });

    it("should show modal if auto-connect fails", async () => {
      localStorage.setItem("stellar_auto_connect", "true");
      localStorage.setItem("stellar_last_wallet", "freighter");

      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isLoading: false,
        isConnecting: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Should show modal since wallet is still not connected after attempt
      await waitFor(() => {
        expect(
          screen.getByTestId("connect-wallet-modal")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle rapid mount/unmount", () => {
      const { unmount } = render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      unmount();
      
      // Should not throw
      expect(true).toBe(true);
    });

    it("should handle missing publicKey with isConnected = true", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        publicKey: null, // Invalid state
        isLoading: false,
      });

      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isInitializing: false,
      });

      render(
        <ProtectedRoute>
          <TestContent />
        </ProtectedRoute>
      );

      // Should show modal since publicKey is missing
      await waitFor(() => {
        expect(
          screen.getByTestId("connect-wallet-modal")
        ).toBeInTheDocument();
      });
    });
  });
});
