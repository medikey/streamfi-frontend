/**
 * StellarWalletContext tests
 * Tests the connect, disconnect, and state update functionality
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  StellarWalletProvider,
  useStellarWallet,
} from "@/contexts/stellar-wallet-context";

// Mock the stellar-wallets-kit
jest.mock("@creit.tech/stellar-wallets-kit", () => ({
  StellarWalletsKit: jest.fn().mockImplementation(() => ({
    openModal: jest.fn(),
    setWallet: jest.fn(),
    getAddress: jest.fn(),
  })),
  WalletNetwork: {
    PUBLIC: "PUBLIC",
    TESTNET: "TESTNET",
  },
  FREIGHTER_ID: "freighter",
  allowAllModules: jest.fn(() => ({})),
}));

// Test component that uses the hook
function TestComponent() {
  const { isConnected, publicKey, connect, connectWallet, disconnect } =
    useStellarWallet();

  return (
    <div>
      <div data-testid="connection-status">
        {isConnected ? "Connected" : "Disconnected"}
      </div>
      <div data-testid="public-key">{publicKey || "No key"}</div>
      <button onClick={connect} data-testid="connect-btn">
        Connect Wallet
      </button>
      <button
        onClick={() => connectWallet("freighter")}
        data-testid="connect-freighter-btn"
      >
        Connect Freighter
      </button>
      <button onClick={disconnect} data-testid="disconnect-btn">
        Disconnect
      </button>
    </div>
  );
}

describe("StellarWalletContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("Initial state", () => {
    it("should initialize with no wallet connected", () => {
      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      expect(screen.getByTestId("connection-status")).toHaveTextContent(
        "Disconnected"
      );
      expect(screen.getByTestId("public-key")).toHaveTextContent("No key");
    });

    it("should throw error when using hook outside provider", () => {
      // Suppress the error output for this test
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useStellarWallet must be used within a StellarWalletProvider");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("connect()", () => {
    it("should open wallet selection modal", async () => {
      const mockOpenModal = jest.fn();
      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => ({
          openModal: mockOpenModal,
          setWallet: jest.fn(),
          getAddress: jest.fn(),
        }));

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      const connectBtn = screen.getByTestId("connect-btn");
      fireEvent.click(connectBtn);

      await waitFor(() => {
        expect(mockOpenModal).toHaveBeenCalled();
      });
    });

    it("should set public key when wallet is selected", async () => {
      const testAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      const mockKit = {
        openModal: jest.fn((options) => {
          // Simulate user selecting a wallet
          setTimeout(() => {
            options.onWalletSelected({
              id: "freighter",
              name: "Freighter",
            });
          }, 0);
        }),
        setWallet: jest.fn(),
        getAddress: jest.fn().mockResolvedValue({ address: testAddress }),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      const connectBtn = screen.getByTestId("connect-btn");
      fireEvent.click(connectBtn);

      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent(
          "Connected"
        );
      });

      expect(screen.getByTestId("public-key")).toHaveTextContent(testAddress);
    });

    it("should store wallet info in localStorage on successful connection", async () => {
      const testAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      const mockKit = {
        openModal: jest.fn((options) => {
          setTimeout(() => {
            options.onWalletSelected({
              id: "freighter",
              name: "Freighter",
            });
          }, 0);
        }),
        setWallet: jest.fn(),
        getAddress: jest.fn().mockResolvedValue({ address: testAddress }),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      fireEvent.click(screen.getByTestId("connect-btn"));

      await waitFor(() => {
        expect(localStorage.getItem("stellar_last_wallet")).toBe("freighter");
        expect(localStorage.getItem("stellar_auto_connect")).toBe("true");
      });
    });

    it("should handle connection errors gracefully", async () => {
      const mockKit = {
        openModal: jest.fn((options) => {
          setTimeout(() => {
            options.onWalletSelected({ id: "freighter" });
          }, 0);
        }),
        setWallet: jest.fn(),
        getAddress: jest
          .fn()
          .mockRejectedValue(new Error("Wallet not found")),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      fireEvent.click(screen.getByTestId("connect-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent(
          "Disconnected"
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("connectWallet()", () => {
    it("should connect specific wallet by ID", async () => {
      const testAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      const mockKit = {
        openModal: jest.fn(),
        setWallet: jest.fn(),
        getAddress: jest
          .fn()
          .mockResolvedValue({ address: testAddress }),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      fireEvent.click(screen.getByTestId("connect-freighter-btn"));

      await waitFor(() => {
        expect(mockKit.setWallet).toHaveBeenCalledWith("freighter");
        expect(mockKit.getAddress).toHaveBeenCalled();
      });

      expect(screen.getByTestId("public-key")).toHaveTextContent(testAddress);
    });

    it("should handle wallet not installed error", async () => {
      const mockKit = {
        openModal: jest.fn(),
        setWallet: jest.fn(),
        getAddress: jest
          .fn()
          .mockRejectedValue(new Error("Extension not found")),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      fireEvent.click(screen.getByTestId("connect-freighter-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent(
          "Disconnected"
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("should handle user rejection", async () => {
      const mockKit = {
        openModal: jest.fn(),
        setWallet: jest.fn(),
        getAddress: jest
          .fn()
          .mockRejectedValue(new Error("User rejected")),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      fireEvent.click(screen.getByTestId("connect-freighter-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent(
          "Disconnected"
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("disconnect()", () => {
    it("should disconnect wallet and clear state", async () => {
      const testAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      const mockKit = {
        openModal: jest.fn(),
        setWallet: jest.fn(),
        getAddress: jest
          .fn()
          .mockResolvedValue({ address: testAddress }),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      // Set up localStorage for auto-connect
      localStorage.setItem("stellar_last_wallet", "freighter");
      localStorage.setItem("stellar_auto_connect", "true");

      // Connect wallet
      fireEvent.click(screen.getByTestId("connect-freighter-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent(
          "Connected"
        );
      });

      // Disconnect
      fireEvent.click(screen.getByTestId("disconnect-btn"));

      await waitFor(() => {
        expect(screen.getByTestId("connection-status")).toHaveTextContent(
          "Disconnected"
        );
        expect(screen.getByTestId("public-key")).toHaveTextContent("No key");
      });

      // Verify localStorage is cleared
      expect(localStorage.getItem("stellar_last_wallet")).toBeNull();
      expect(localStorage.getItem("stellar_auto_connect")).toBeNull();
    });
  });

  describe("Auto-connect for returning users", () => {
    it("should attempt auto-connect when flags are set", async () => {
      const testAddress = "GBZVMB74Z7STQBIV5FZC3TR3C5GBUQWWXNQNCONFYKHTQNIJ4QC5EXT5";
      const mockKit = {
        openModal: jest.fn(),
        setWallet: jest.fn(),
        getAddress: jest
          .fn()
          .mockResolvedValue({ address: testAddress }),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      // Set up localStorage for returning user
      localStorage.setItem("stellar_last_wallet", "freighter");
      localStorage.setItem("stellar_auto_connect", "true");

      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      // Auto-connect happens after a delay
      await waitFor(
        () => {
          expect(mockKit.setWallet).toHaveBeenCalledWith("freighter");
        },
        { timeout: 2000 }
      );
    });

    it("should not auto-connect without flags", async () => {
      const mockKit = {
        openModal: jest.fn(),
        setWallet: jest.fn(),
        getAddress: jest.fn(),
      };

      jest
        .spyOn(
          require("@creit.tech/stellar-wallets-kit"),
          "StellarWalletsKit"
        )
        .mockImplementation(() => mockKit);

      // No localStorage flags set
      render(
        <StellarWalletProvider>
          <TestComponent />
        </StellarWalletProvider>
      );

      // Wait to ensure auto-connect would have been called
      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(mockKit.setWallet).not.toHaveBeenCalled();
    });
  });
});
