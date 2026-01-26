/**
 * Connection Store Tests - Phase 2 Verification
 *
 * Tests for Zustand connection store:
 * - Store initialization and state management
 * - Connection state transitions
 * - WebSocket lifecycle tracking
 * - Connection attempt history
 * - Metrics calculation and updates
 * - Store subscriptions
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { ConnectionState } from '../../lib/jellyfin-apiclient/connectionState';
import { createConnectionStore, type ConnectionAttempt } from '../connectionStore';

describe('Connection Store (Phase 2: Modern State Management)', () => {
    let store: ReturnType<typeof createConnectionStore>;

    beforeEach(() => {
        store = createConnectionStore();
    });

    describe('Store Initialization', () => {
        it('should initialize with default state', () => {
            const state = store.getState();
            expect(state.currentState).toBe(ConnectionState.ServerSelection);
            expect(state.webSocketState).toBe('idle');
            expect(state.currentApiClient).toBeNull();
            expect(state.availableServers).toEqual([]);
            expect(state.connectionAttempts).toEqual([]);
        });

        it('should initialize with custom state', () => {
            const customStore = createConnectionStore({
                currentState: ConnectionState.SignedIn
            });

            expect(customStore.getState().currentState).toBe(ConnectionState.SignedIn);
        });

        it('should have initialized metrics', () => {
            const state = store.getState();
            expect(state.metrics).toEqual({
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                averageConnectionTime: 0,
                lastConnectionTime: undefined,
                lastError: undefined
            });
        });
    });

    describe('Connection State Management', () => {
        it('should update connection state', () => {
            store.setState({ currentState: ConnectionState.ServerSignIn });
            expect(store.getState().currentState).toBe(ConnectionState.ServerSignIn);
        });

        it('should support all connection states', () => {
            const states = [
                ConnectionState.SignedIn,
                ConnectionState.ServerMismatch,
                ConnectionState.ServerSignIn,
                ConnectionState.ServerSelection,
                ConnectionState.ServerUpdateNeeded,
                ConnectionState.Unavailable
            ];

            states.forEach((state) => {
                store.getState().setCurrentState(state);
                expect(store.getState().currentState).toBe(state);
            });
        });
    });

    describe('WebSocket Lifecycle Tracking', () => {
        it('should track WebSocket state transitions', () => {
            // Initial state
            expect(store.getState().webSocketState).toBe('idle');

            // Connecting
            store.getState().setWebSocketState('connecting');
            expect(store.getState().webSocketState).toBe('connecting');

            // Connected
            store.getState().setWebSocketState('connected');
            expect(store.getState().webSocketState).toBe('connected');
            expect(store.getState().webSocketConnectedAt).toBeDefined();

            // Disconnected
            store.getState().setWebSocketState('disconnected');
            expect(store.getState().webSocketState).toBe('disconnected');
            expect(store.getState().webSocketConnectedAt).toBeUndefined();
        });

        it('should set error on WebSocket error state', () => {
            store.getState().setWebSocketState('error');
            expect(store.getState().webSocketState).toBe('error');
            expect(store.getState().webSocketError).toBeDefined();
        });

        it('should track connection timestamp on successful WebSocket connect', () => {
            const before = Date.now();
            store.getState().setWebSocketState('connected');
            const after = Date.now();
            const connectedAt = store.getState().webSocketConnectedAt;

            expect(connectedAt).toBeDefined();
            expect(connectedAt!).toBeGreaterThanOrEqual(before);
            expect(connectedAt!).toBeLessThanOrEqual(after);
        });
    });

    describe('Server Management', () => {
        it('should set and track current server ID', () => {
            store.getState().setCurrentServerId('server-123');
            expect(store.getState().currentServerId).toBe('server-123');
        });

        it('should clear current server ID', () => {
            store.getState().setCurrentServerId('server-123');
            store.getState().setCurrentServerId(undefined);
            expect(store.getState().currentServerId).toBeUndefined();
        });

        it('should update available servers', () => {
            const servers = [
                { Id: 'server-1', Name: 'Server One' },
                { Id: 'server-2', Name: 'Server Two' }
            ];

            store.getState().setAvailableServers(servers);
            expect(store.getState().availableServers).toEqual(servers);
        });
    });

    describe('Connection Attempt History', () => {
        it('should add connection attempts with success result', () => {
            const attempt: ConnectionAttempt = {
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 250,
                result: 'success'
            };

            store.getState().addConnectionAttempt(attempt);

            const attempts = store.getState().connectionAttempts;
            expect(attempts).toHaveLength(1);
            expect(attempts[0]).toEqual(attempt);
        });

        it('should add connection attempts with failure result', () => {
            const attempt: ConnectionAttempt = {
                serverId: 'server-1',
                serverName: 'My Server',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Connection timeout'
            };

            store.getState().addConnectionAttempt(attempt);

            const attempts = store.getState().connectionAttempts;
            expect(attempts).toHaveLength(1);
            expect(attempts[0].error).toBe('Connection timeout');
        });

        it('should maintain only last 50 attempts', () => {
            // Add 60 attempts
            for (let i = 0; i < 60; i++) {
                store.getState().addConnectionAttempt({
                    serverId: `server-${i}`,
                    serverName: `Server ${i}`,
                    timestamp: Date.now() + i * 1000,
                    duration: 100,
                    result: 'success'
                });
            }

            expect(store.getState().connectionAttempts).toHaveLength(50);
            // Should keep the most recent 50 (attempts 10-59)
            expect(store.getState().connectionAttempts[0].serverId).toBe('server-10');
            expect(store.getState().connectionAttempts[49].serverId).toBe('server-59');
        });

        it('should clear connection history', () => {
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server One',
                timestamp: Date.now(),
                duration: 250,
                result: 'success'
            });

            expect(store.getState().connectionAttempts).toHaveLength(1);

            store.getState().clearConnectionHistory();
            expect(store.getState().connectionAttempts).toHaveLength(0);
        });
    });

    describe('Metrics Calculation', () => {
        it('should calculate metrics for successful attempts', () => {
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            const metrics = store.getState().metrics;
            expect(metrics.totalAttempts).toBe(1);
            expect(metrics.successfulAttempts).toBe(1);
            expect(metrics.failedAttempts).toBe(0);
            expect(metrics.averageConnectionTime).toBe(100);
            expect(metrics.lastConnectionTime).toBe(100);
        });

        it('should calculate metrics for failed attempts', () => {
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Timeout'
            });

            const metrics = store.getState().metrics;
            expect(metrics.totalAttempts).toBe(1);
            expect(metrics.successfulAttempts).toBe(0);
            expect(metrics.failedAttempts).toBe(1);
            expect(metrics.lastError).toBe('Timeout');
        });

        it('should calculate average connection time correctly', () => {
            // Add 3 successful attempts with durations: 100, 200, 300
            [100, 200, 300].forEach((duration) => {
                store.getState().addConnectionAttempt({
                    serverId: 'server-1',
                    serverName: 'Server',
                    timestamp: Date.now(),
                    duration,
                    result: 'success'
                });
            });

            // (100 + 200 + 300) / 3 = 200
            expect(store.getState().metrics.averageConnectionTime).toBe(200);
        });

        it('should handle mixed success and failure attempts', () => {
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 150,
                result: 'success'
            });

            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'Network error'
            });

            const metrics = store.getState().metrics;
            expect(metrics.totalAttempts).toBe(2);
            expect(metrics.successfulAttempts).toBe(1);
            expect(metrics.failedAttempts).toBe(1);
            expect(metrics.averageConnectionTime).toBe(150); // Only successful attempts
        });

        it('should update metrics manually', () => {
            store.getState().updateMetrics({
                totalAttempts: 10,
                successfulAttempts: 8
            });

            const metrics = store.getState().metrics;
            expect(metrics.totalAttempts).toBe(10);
            expect(metrics.successfulAttempts).toBe(8);
            expect(metrics.failedAttempts).toBe(0); // Unchanged
        });
    });

    describe('User Context', () => {
        it('should set and clear user ID', () => {
            store.getState().setCurrentUserId('user-123');
            expect(store.getState().currentUserId).toBe('user-123');

            store.getState().setCurrentUserId(undefined);
            expect(store.getState().currentUserId).toBeUndefined();
        });
    });

    describe('Error Management', () => {
        it('should track and clear last error', () => {
            store.getState().setLastError('Connection failed');
            expect(store.getState().lastError).toBe('Connection failed');

            store.getState().setLastError(undefined);
            expect(store.getState().lastError).toBeUndefined();
        });

        it('should update error on connection attempt failure', () => {
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 5000,
                result: 'failure',
                error: 'DNS resolution failed'
            });

            expect(store.getState().lastError).toBe('DNS resolution failed');
        });
    });

    describe('Store Reset', () => {
        it('should reset all state to initial values', () => {
            // Modify various state values
            store.getState().setCurrentState(ConnectionState.SignedIn);
            store.getState().setCurrentServerId('server-1');
            store.getState().setCurrentUserId('user-1');
            store.getState().setLastError('Some error');
            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            // Reset
            store.getState().reset();

            // Verify all state is reset
            const state = store.getState();
            expect(state.currentState).toBe(ConnectionState.ServerSelection);
            expect(state.currentServerId).toBeUndefined();
            expect(state.currentUserId).toBeUndefined();
            expect(state.lastError).toBeUndefined();
            expect(state.connectionAttempts).toHaveLength(0);
            expect(state.metrics.totalAttempts).toBe(0);
        });
    });

    describe('Store Subscriptions', () => {
        it('should notify subscribers when connection state changes', () => {
            let notified = false;
            let lastState: ConnectionState | undefined;

            const unsubscribe = store.subscribe(
                (state) => state.currentState,
                (state) => {
                    notified = true;
                    lastState = state;
                }
            );

            store.getState().setCurrentState(ConnectionState.SignedIn);

            expect(notified).toBe(true);
            expect(lastState).toBe(ConnectionState.SignedIn);

            unsubscribe();
        });

        it('should notify subscribers when metrics change', () => {
            let notified = false;

            const unsubscribe = store.subscribe(
                (state) => state.metrics,
                () => {
                    notified = true;
                }
            );

            store.getState().addConnectionAttempt({
                serverId: 'server-1',
                serverName: 'Server',
                timestamp: Date.now(),
                duration: 100,
                result: 'success'
            });

            expect(notified).toBe(true);

            unsubscribe();
        });

        it('should allow selective subscriptions', () => {
            const changes: string[] = [];

            const unsubscribe = store.subscribe(
                (state) => state.webSocketState,
                (state) => {
                    changes.push(state);
                }
            );

            store.getState().setWebSocketState('connecting');
            store.getState().setWebSocketState('connected');
            store.getState().setCurrentState(ConnectionState.SignedIn); // Should not trigger

            expect(changes).toEqual(['connecting', 'connected']);
            expect(changes).toHaveLength(2); // Not 3

            unsubscribe();
        });
    });
});
