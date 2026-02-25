/**
 * AuthProvider tests
 * Tests session creation, auto-connect detection, and logout cleanup
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { useStellarWallet } from "@/contexts/stellar-wallet-context";
import { useUserProfile } from "@/hooks/useUserProfile";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock StellarWallet context
jest.mock("@/contexts/stellar-wallet-context", () => ({
  useStellarWallet: jest.fn(),
}));

// Mock useUserProfile hook
jest.mock("@/hooks/useUserProfile", () => ({
  useUserProfile: jest.fn(),
}));

// Test component that uses auth
function TestAuthComponent() {
  const {
    user,
    isLoading,
    isInitializing,
    error,
    logout,
    refreshUser,
    isWalletConnecting,
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isInitializing
          ? "Initializing"
          : isWalletConnecting
            ? "Connecting"
            : "Ready"}
      </div>
      <div data-testid="user-info">
        {user ? `Logged in as ${user.username}` : "Not logged in"}
      </div>
      <div data-testid="error">{error || "No error"}</div>
      <div data-testid="loading">{isLoading ? "Loading" : "Not loading"}</div>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
      <button onClick={() => refreshUser()} data-testid="refresh-btn">
        Refresh User
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockWallet = {
    address: "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5",
    publicKey: "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5",
    isConnected: false,
    isLoading: false,
    status: "disconnected" as const,
    disconnect: jest.fn(),
    connect: jest.fn(),
    connectWallet: jest.fn(),
    isConnecting: false,
    error: null,
    kit: {} as any,
  };

  const mockUser = {
    id: "123",
    wallet: "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5",
    username: "testuser",
    email: "test@example.com",
    bio: "Test bio",
    avatar: null,
    creator: null,
    streamkey: null,
    socialLinks: null,
    isVerified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useStellarWallet as jest.Mock).mockReturnValue(mockWallet);
    (useUserProfile as jest.Mock).mockReturnValue({
      user: undefined,
      isLoading: false,
      mutate: jest.fn().mockResolvedValue(mockUser),
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Initialization", () => {
    it("should initialize as not authenticated when no wallet is connected", async () => {
      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).not.toHaveTextContent(
          "Initializing"
        );
      });

      expect(screen.getByTestId("user-info")).toHaveTextContent(
        "Not logged in"
      );
    });

    it("should set user when wallet is connected", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: jest.fn(),
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-info")).toHaveTextContent(
          `Logged in as ${mockUser.username}`
        );
      });
    });

    it("should detect returning user with auto-connect flag", async () => {
      localStorage.setItem("stellar_auto_connect", "true");
      localStorage.setItem("stellar_last_wallet", "freighter");

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      // Should be initializing while attempting auto-connect
      expect(screen.getByTestId("auth-status")).toHaveTextContent(
        "Initializing"
      );
    });
  });

  describe("Session management", () => {
    it("should set session cookies when wallet connects", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: jest.fn(),
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem("wallet")).toBe(mockWallet.address);
      });

      // Check for session storage
      expect(sessionStorage.getItem("wallet")).toBe(mockWallet.address);
    });

    it("should clear session data when wallet disconnects", async () => {
      // First connect
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      const { rerender } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem("wallet")).toBe(mockWallet.address);
      });

      // Then disconnect
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: false,
        address: null,
      });

      rerender(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem("wallet")).toBeNull();
        expect(sessionStorage.getItem("wallet")).toBeNull();
      });
    });

    it("should persist auto-connect flag when connected", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: jest.fn(),
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(localStorage.getItem("stellar_auto_connect")).toBe("true");
      });
    });
  });

  describe("logout()", () => {
    it("should clear all auth data and redirect", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
        disconnect: jest.fn(),
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: jest.fn(),
      });

      localStorage.setItem("stellar_auto_connect", "true");
      localStorage.setItem("stellar_last_wallet", "freighter");

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const logoutBtn = screen.getByTestId("logout-btn");
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/");
      });

      // Verify all data is cleared
      expect(localStorage.getItem("stellar_auto_connect")).toBeNull();
      expect(localStorage.getItem("stellar_last_wallet")).toBeNull();
      expect(localStorage.getItem("wallet")).toBeNull();
      expect(sessionStorage.getItem("wallet")).toBeNull();
    });

    it("should call wallet disconnect on logout", async () => {
      const mockDisconnect = jest.fn();

      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
        disconnect: mockDisconnect,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: jest.fn(),
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId("logout-btn"));

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });
  });

  describe("refreshUser()", () => {
    it("should refresh user data from API", async () => {
      const mockMutate = jest.fn().mockResolvedValue(mockUser);

      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: mockMutate,
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      const refreshBtn = screen.getByTestId("refresh-btn");
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe("Error handling", () => {
    it("should handle initialization errors gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock localStorage to throw error
      const getItemSpy = jest
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("Storage error");
        });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      // Should still initialize despite error
      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent("Ready");
      });

      getItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should handle SWR loading state", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: undefined,
        isLoading: true,
        mutate: jest.fn(),
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
    });
  });

  describe("Wallet connection state management", () => {
    it("should track wallet connecting state", async () => {
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isLoading: true,
        isConnecting: true,
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId("auth-status")).toHaveTextContent("Connecting");
    });

    it("should clear local user state when wallet disconnects", async () => {
      const { rerender } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      // Connect wallet
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: true,
        address: mockWallet.address,
      });

      (useUserProfile as jest.Mock).mockReturnValue({
        user: mockUser,
        isLoading: false,
        mutate: jest.fn(),
      });

      rerender(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-info")).toHaveTextContent(
          `Logged in as ${mockUser.username}`
        );
      });

      // Disconnect wallet
      (useStellarWallet as jest.Mock).mockReturnValue({
        ...mockWallet,
        isConnected: false,
        address: null,
      });

      rerender(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-info")).toHaveTextContent(
          "Not logged in"
        );
      });
    });
  });
});
